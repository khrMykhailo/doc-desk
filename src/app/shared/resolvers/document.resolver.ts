import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { DocumentApiResponse } from '../interfaces/document-response.interface';
import { DocumentService } from '../services/document.service';
import { catchError, map, of } from 'rxjs';

export const documentResolver: ResolveFn<DocumentApiResponse> = () => {
  const documentService = inject(DocumentService);
  
  
  return documentService.getDocuments({ page: 1, size: 10 }).pipe(
    map(response => {
      
      if (response.results.length > 0) {
        const firstDocument = response.results[0];
        if (firstDocument.creator) {
          localStorage.setItem('role', 'REVIEWER');
        } else {
          localStorage.setItem('role', 'USER');
        }
      }
      return response;
    }),
    catchError(error => {
      console.error('Error fetching documents:', error);
      return of({
        count: 0,
        results: []
      });
    })
  );
}; 