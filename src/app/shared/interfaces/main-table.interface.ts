import { DocumentStatus } from '../enums/document-status.enum';

export interface Creator {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface TableItem {
  id: string;
  name: string;
  status: DocumentStatus;
  creator?: Creator;
  updatedAt: string;
  createdAt: string;
  fileUrl?: string;
} 