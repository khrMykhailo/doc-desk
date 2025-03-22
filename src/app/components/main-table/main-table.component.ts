import { Component, ViewEncapsulation, OnInit, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TableItem } from '../../shared/interfaces/main-table.interface';
import { DocumentStatus } from '../../shared/enums/document-status.enum';
import { FormatStatusPipe } from '../../shared/pipes';
import { ActivatedRoute } from '@angular/router';
import { DocumentService } from '../../shared/services/document.service';
import { DocumentApiResponse } from '../../shared/interfaces/document-response.interface';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap, catchError, skip } from 'rxjs';

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
    FormatStatusPipe
  ],
  templateUrl: './main-table.component.html',
  styleUrl: './main-table.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MainTableComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  
  displayedColumns: string[] = ['file', 'status', 'creator', 'actions'];
  documentStatus = DocumentStatus;
  
  pageSize = signal<number>(10);
  pageIndex = signal<number>(1);
  
  resolverData = toSignal<DocumentApiResponse>(
    this.route.data.pipe(
      map(data => data['documents'] as DocumentApiResponse)
    )
  );
  
  private paginationParams = computed(() => ({
    page: this.pageIndex(),
    size: this.pageSize()
  }));
  
  private isFirstLoad = signal<boolean>(true);
  
  private documents$ = toObservable(this.paginationParams).pipe(
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
  
  ngOnInit(): void {
    const initialData = this.resolverData();
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
  
  addNewItem() {
    console.log('Add new item clicked');
  }
  
  getStatusClass(status: DocumentStatus): string {
    return 'status-' + status.toString().toLowerCase().replace(/_/g, '-');
  }

  editItem(item: TableItem) {
    console.log('Edit item:', item);
  }

  submitForReview(item: TableItem) {
    console.log('Submit for review:', item);
  }

  declineItem(item: TableItem) {
    console.log('Decline item:', item);
  }

  deleteItem(item: TableItem) {
    console.log('Delete item:', item);
  }

  canSubmitForReview(status: DocumentStatus): boolean {
    return status === DocumentStatus.DRAFT;
  }

  canDecline(status: DocumentStatus): boolean {
    return status === DocumentStatus.READY_FOR_REVIEW;
  }

  canDelete(status: DocumentStatus): boolean {
    return status === DocumentStatus.DECLINED || status === DocumentStatus.DRAFT;
  }
}
