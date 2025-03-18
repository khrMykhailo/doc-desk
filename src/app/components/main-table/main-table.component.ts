import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TableItem } from '../../shared/interfaces/main-table.interface';
import { TABLE_DATA } from '../../shared/constants/main-table.constants';
import { DocumentStatus } from '../../shared/enums/document-status.enum';
import { FormatStatusPipe } from '../../shared/pipes';

@Component({
  selector: 'app-main-table',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatMenuModule,
    FormatStatusPipe
  ],
  templateUrl: './main-table.component.html',
  styleUrl: './main-table.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MainTableComponent {
  displayedColumns: string[] = ['file', 'status', 'creator', 'actions'];
  dataSource = TABLE_DATA;
  documentStatus = DocumentStatus;
  
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
