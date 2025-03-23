import { DocumentStatus } from '../enums/document-status.enum';

export interface DocumentFormData {
  name: string;
  status: DocumentStatus;
  file: File | null;
} 