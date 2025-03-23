import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentApiResponse, PaginationParams } from '../interfaces/document-response.interface';
import { environment } from '../../../environments/environment';
import { TableItem } from '../interfaces/main-table.interface';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private baseUrl = environment.apiUrl + '/api/v1/document';

  constructor(private http: HttpClient) { }

  getDocuments(params: PaginationParams): Observable<DocumentApiResponse> {
    let httpParams = new HttpParams();
    
    httpParams = httpParams.append('page', params.page.toString());
    httpParams = httpParams.append('size', params.size.toString());
    
    if (params.sort) {
      httpParams = httpParams.append('sort', params.sort);
    }

    return this.http.get<DocumentApiResponse>(this.baseUrl, { params: httpParams });
  }
  
  getDocumentById(documentId: string): Observable<TableItem> {
    return this.http.get<TableItem>(`${this.baseUrl}/${documentId}`);
  }
  
  updateDocument(documentId: string, formData: FormData): Observable<TableItem> {
    return this.http.put<TableItem>(`${this.baseUrl}/${documentId}/content`, formData);
  }
  
  getDocumentContent(documentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${documentId}/content`, { responseType: 'blob' });
  }
  
  createDocument(formData: FormData): Observable<TableItem> {
    return this.http.post<TableItem>(this.baseUrl, formData);
  }
} 