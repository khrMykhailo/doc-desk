import { TableItem } from '../interfaces/main-table.interface';
import { DocumentStatus } from '../enums/document-status.enum';

export const TABLE_DATA: TableItem[] = [
  {file: 'document1.pdf', status: DocumentStatus.APPROVED, creator: 'Elena Peterson'},
  {file: 'presentation.pptx', status: DocumentStatus.REVOKE, creator: 'John Miller'},
  {file: 'report_2023.docx', status: DocumentStatus.APPROVED, creator: 'Maria Collins'},
  {file: 'budget.xlsx', status: DocumentStatus.DECLINED, creator: 'Andrew Smith'},
  {file: 'contract.pdf', status: DocumentStatus.APPROVED, creator: 'Natalie Evans'},
  {file: 'project_plan.docx', status: DocumentStatus.UNDER_REVIEW, creator: 'Peter Simons'},
  {file: 'analysis.pdf', status: DocumentStatus.READY_FOR_REVIEW, creator: 'Tanya Krause'},
  {file: 'invoice.pdf', status: DocumentStatus.APPROVED, creator: 'Victoria Bond'},
  {file: 'research.docx', status: DocumentStatus.DRAFT, creator: 'Michael Powell'},
  {file: 'meeting_notes.txt', status: DocumentStatus.REVOKE, creator: 'Oliver Lee'},
]; 