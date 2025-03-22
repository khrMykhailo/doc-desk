import { Component, ViewEncapsulation, OnInit, signal } from '@angular/core';
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
  displayedColumns: string[] = ['file', 'status', 'creator', 'actions'];
  dataSource = signal<TableItem[]>([]);
  documentStatus = DocumentStatus;
  
  // Параметри пагінації
  totalItems = signal<number>(0);
  pageSize = signal<number>(10);
  pageIndex = signal<number>(0);
  
  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService
  ) {}
  
  ngOnInit(): void {
    // Отримуємо дані з резолвера
    this.route.data.subscribe(data => {
      const documents = data['documents'] as DocumentApiResponse;
      this.dataSource.set(documents.results);
      this.totalItems.set(documents.count);
      this.pageSize.set(10); // За замовчуванням встановлюємо розмір сторінки
      this.pageIndex.set(1); // За замовчуванням встановлюємо першу сторінку
    });
  }
  
  onPageChange(event: PageEvent): void {
    const page = event.pageIndex;
    const size = event.pageSize;
    
    // Завантажуємо нові дані при зміні сторінки
    this.documentService.getDocuments({ page, size })
      .subscribe(documents => {
        this.dataSource.set(documents.results);
        this.totalItems.set(documents.count);
      });
  }
  
  addNewItem() {
    console.log('Add new item clicked');
    // Logic for adding a new item will be here
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
