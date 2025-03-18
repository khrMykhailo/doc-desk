import { DocumentStatus } from '../enums/document-status.enum';

export interface TableItem {
  file: string;
  status: DocumentStatus;
  creator: string;
} 