import { Pipe, PipeTransform } from '@angular/core';
import { DocumentStatus } from '../enums/document-status.enum';

@Pipe({
  name: 'formatStatus',
  standalone: true
})
export class FormatStatusPipe implements PipeTransform {
  transform(status: DocumentStatus): string {
    if (!status) {
      return '';
    }
    const formatted = status.toString().toLowerCase().replace(/_/g, ' ');
    
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
} 