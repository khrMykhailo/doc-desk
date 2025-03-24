import { Component, ViewEncapsulation, OnInit, signal, inject, computed, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TableItem } from '../../shared/interfaces/main-table.interface';
import { DocumentStatus } from '../../shared/enums/document-status.enum';
import { FormatStatusPipe } from '../../shared/pipes';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../../shared/services/document.service';
import { AuthService, UserRole } from '../../shared/services/auth.service';
import { DocumentApiResponse } from '../../shared/interfaces/document-response.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddDocumentModalComponent } from '../add-document-modal/add-document-modal.component';
import { EditDocumentModalComponent } from '../edit-document-modal/edit-document-modal.component';

@Component({
  selector: 'app-main-table',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatMenuModule,
    MatPaginatorModule,
    MatDialogModule,
    FormatStatusPipe
  ],
  templateUrl: './main-table.component.html',
  styleUrl: './main-table.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MainTableComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  
  displayedColumns = signal<string[]>(['file', 'status', 'updatedAt', 'actions']);
  
  documentStatus = DocumentStatus;
  
  pageSize = signal<number>(10);
  pageIndex = signal<number>(0);
  
  refreshTrigger = signal<number>(0);
  
  resolverData = signal<DocumentApiResponse | null>(null);
  
  paginationParams = computed(() => ({
    page: this.pageIndex() + 1,
    size: this.pageSize()
  }));
  
  isFirstLoad = signal<boolean>(true);
  
  documentsData = signal<DocumentApiResponse>({ count: 0, results: [] });
  
  dataSource = computed(() => this.documentsData().results);
  totalItems = computed(() => this.documentsData().count);
  
  documents = signal<TableItem[]>([]);
  filteredDocuments = computed(() => this.documents());
  
  constructor() {
    effect(() => {
      const role = this.authService.currentRole();
      this.updateDisplayedColumns();
    });
    
    effect(() => {
      const pageParams = this.paginationParams();
      const refreshCount = this.refreshTrigger();
      
      this.loadDocumentsData();
    });
  }
  
  ngOnInit(): void {
    this.route.data.subscribe(data => {
      const documents = data['documents'] as DocumentApiResponse;
      if (documents) {
        this.resolverData.set(documents);
        this.documentsData.set(documents);
        this.isFirstLoad.set(false);
      }
    });
    
    this.updateDisplayedColumns();
  }
  
  updateDisplayedColumns(): void {
    const baseColumns = ['file', 'status', 'updatedAt', 'actions'];
    if (this.isReviewer()) {
      this.displayedColumns.set(['file', 'status', 'updatedAt', 'creator', 'actions']);
    } else {
      this.displayedColumns.set(baseColumns);
    }
  }
  
  refreshData(): void {
    this.refreshTrigger.update(count => count + 1);
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
  
  private loadDocumentsData(): void {
    if (this.isFirstLoad() && this.resolverData()) {
      this.documentsData.set(this.resolverData()!);
      this.isFirstLoad.set(false);
      return;
    }
    
    this.documentService.getDocuments(this.paginationParams())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.documentsData.set(response);
        },
        error: (error) => {
          console.error('Error loading documents:', error);
          this.documentsData.set({ count: 0, results: [] });
        }
      });
  }
  
  addNewItem() {
    if (!this.isUser()) {
      return;
    }
    
    const dialogRef = this.dialog.open(AddDocumentModalComponent, {
      width: '550px',
      disableClose: true
    });

    dialogRef.afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result) {
        this.pageIndex.set(0);
        this.refreshData();
      }
    });
  }
  
  getStatusClass(status: DocumentStatus): string {
    return 'status-' + status.toString().toLowerCase().replace(/_/g, '-');
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isUser(): boolean {
    return this.authService.isUser();
  }
  
  isReviewer(): boolean {
    return this.authService.isReviewer();
  }

  viewItem(item: TableItem) {
    this.router.navigate(['/documents', item.id, 'view']);
  }

  editItem(item: TableItem) {
    console.log('Edit item:', item);
    
    const dialogRef = this.dialog.open(EditDocumentModalComponent, {
      width: '500px',
      data: {
        documentId: item.id,
        documentName: item.name,
        documentStatus: item.status
      }
    });
    
    dialogRef.afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.refreshData();
    });
  }

  submitForReview(item: TableItem) {
    if (!this.isUser()) {
      return;
    }
    
    this.documentService.submitForReview(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.refreshData();
        },
        error: (error) => {
          console.error('Error submitting document for review:', error);
        }
      });
  }

  revokeDocument(item: TableItem) {
    if (!this.isUser()) {
      return;
    }
    
    this.documentService.revokeDocument(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.refreshData();
        },
        error: (error) => {
          console.error('Error revoking document:', error);
        }
      });
  }

  deleteItem(item: TableItem) {
    if (!this.isUser()) {
      return;
    }
    
    this.documentService.deleteDocument(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.refreshData();
        },
        error: (error) => {
          console.error('Error deleting document:', error);
        }
      });
  }

  changeStatus(item: TableItem, status: DocumentStatus) {
    if (!this.isReviewer()) {
      return;
    }
    
    this.documentService.changeDocumentStatus(item.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.refreshData();
        },
        error: (error) => {
          console.error(`Error changing document status to ${status}:`, error);
        }
      });
  }

  canEdit(item: TableItem): boolean {
    return this.isUser();
  }

  canSubmitForReview(status: DocumentStatus): boolean {
    return this.isUser() && status === DocumentStatus.DRAFT;
  }

  canRevoke(status: DocumentStatus): boolean {
    return this.isUser() && status === DocumentStatus.READY_FOR_REVIEW;
  }

  canDelete(status: DocumentStatus): boolean {
    return this.isUser() && (
      status === DocumentStatus.DRAFT || 
      status === DocumentStatus.DECLINED || 
      status === DocumentStatus.REVOKE
    );
  }
  
  canStartReview(status: DocumentStatus): boolean {
    return this.isReviewer() && status === DocumentStatus.READY_FOR_REVIEW;
  }
  
  canApproveOrDecline(status: DocumentStatus): boolean {
    return this.isReviewer() && status === DocumentStatus.UNDER_REVIEW;
  }

  loadDocuments(): void {
    this.loadDocumentsData();
  }
}
