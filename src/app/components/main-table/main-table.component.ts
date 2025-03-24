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
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
import { map, switchMap, tap, catchError, skip } from 'rxjs';
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
  
  private refreshTrigger = new BehaviorSubject<void>(undefined);
  
  resolverData = toSignal<DocumentApiResponse>(
    this.route.data.pipe(
      map(data => data['documents'] as DocumentApiResponse)
    )
  );
  
  private paginationParams = computed(() => ({
    page: this.pageIndex() + 1,
    size: this.pageSize()
  }));
  
  private isFirstLoad = signal<boolean>(true);
  
  private documents$ = toObservable(this.paginationParams).pipe(
    switchMap(params => this.refreshTrigger.pipe(
      map(() => params)
    )),
    switchMap(params => {
      if (this.isFirstLoad()) {
        const data = this.resolverData();
        if (data) {
          this.isFirstLoad.set(false);
          return of(data);
        }
      }
      
      return this.documentService.getDocuments(params).pipe(
        catchError(() => of({ count: 0, results: [] } as DocumentApiResponse))
      );
    })
  );
  
  documentsData = toSignal(this.documents$, { 
    initialValue: { count: 0, results: [] } 
  });
  
  dataSource = computed(() => this.documentsData().results);
  totalItems = computed(() => this.documentsData().count);
  
  constructor() {
    effect(() => {
      const role = this.authService.currentRole();
      this.updateDisplayedColumns();
    });
  }
  
  ngOnInit(): void {
    const initialData = this.resolverData();
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
    this.refreshTrigger.next();
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
  
  addNewItem() {
    if (!this.isUser()) {
      console.log('Only users can add new documents');
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
        console.log('Document created:', result);
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
    console.log('View item:', item);
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
      console.log('Document edited, result:', result);
      this.refreshData();
    });
  }

  submitForReview(item: TableItem) {
    if (!this.isUser()) {
      console.log('Only users can submit documents for review');
      return;
    }
    
    console.log('Submit for review:', item);
    this.documentService.submitForReview(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('Document submitted for review');
          this.refreshData();
        },
        error: (error) => {
          console.error('Error submitting document for review:', error);
        }
      });
  }

  revokeDocument(item: TableItem) {
    if (!this.isUser()) {
      console.log('Only users can revoke documents');
      return;
    }
    
    console.log('Revoke document:', item);
    this.documentService.revokeDocument(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('Document revoked');
          this.refreshData();
        },
        error: (error) => {
          console.error('Error revoking document:', error);
        }
      });
  }

  deleteItem(item: TableItem) {
    if (!this.isUser()) {
      console.log('Only users can delete documents');
      return;
    }
    
    console.log('Delete item:', item);
    this.documentService.deleteDocument(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('Document deleted');
          this.refreshData();
        },
        error: (error) => {
          console.error('Error deleting document:', error);
        }
      });
  }

  changeStatus(item: TableItem, status: DocumentStatus) {
    if (!this.isReviewer()) {
      console.log('Only reviewers can change document status');
      return;
    }
    
    console.log(`Changing status to ${status}:`, item);
    this.documentService.changeDocumentStatus(item.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log(`Document status changed to ${status}`);
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
}
