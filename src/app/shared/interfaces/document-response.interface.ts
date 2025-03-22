import { TableItem } from './main-table.interface';

export interface DocumentApiResponse {
  count: number;
  results: TableItem[];
}

export interface PaginationParams {
  page: number;
  size: number;
  sort?: string;
} 