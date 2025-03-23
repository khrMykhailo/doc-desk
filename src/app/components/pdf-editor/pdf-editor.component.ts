import { Component, OnInit, OnDestroy, ElementRef, inject, DestroyRef, input, viewChild, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, from, switchMap, tap, catchError, of } from 'rxjs';
import { DocumentService } from '../../shared/services/document.service';
import { TableItem } from '../../shared/interfaces/main-table.interface';
import { environment } from '../../../environments/environment';

// In Angular, you don't need an explicit import, the script is already included in index.html
// and accessible globally as NutrientViewer

@Component({
  selector: 'app-pdf-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './pdf-editor.component.html',
  styleUrls: ['./pdf-editor.component.scss']
})
export class PdfEditorComponent implements OnInit, OnDestroy {
  pdfContainer = viewChild<ElementRef<HTMLDivElement>>('pdfContainer');
  documentId = input<string>('');
  
  private destroyRef = inject(DestroyRef);
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  document = signal<TableItem | undefined>(undefined);
  instance = signal<any>(null);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);
  
  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.error.set(true);
          return of(null);
        }
        return this.documentService.getDocumentById(id);
      }),
      tap(document => {
        if (document) {
          this.document.set(document);
          this.loadPdfEditor();
        }
      }),
      catchError(err => {
        console.error('Error loading document:', err);
        this.error.set(true);
        return of(null);
      })
    ).subscribe();
  }
  
  ngOnDestroy(): void {
    this.cleanupPdfInstance();
  }
  
  private cleanupPdfInstance(): void {
    const currentInstance = this.instance();
    if (!currentInstance) return;
    
    try {
      if (typeof currentInstance.dispose === 'function') {
        currentInstance.dispose();
      } else if (typeof currentInstance.close === 'function') {
        currentInstance.close();
      } else if (typeof currentInstance.destroy === 'function') {
        currentInstance.destroy();
      } else if (typeof currentInstance.unload === 'function') {
        currentInstance.unload();
      } else {
        console.warn('Could not find method to dispose Nutrient Viewer instance.');
        const container = this.pdfContainer()?.nativeElement;
        if (container) {
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        }
      }
    } catch (e) {
      console.error('Error cleaning up PDF instance:', e);
    } finally {
      this.instance.set(null);
    }
  }
  
  private loadPdfEditor(): void {
    if (!this.document()) {
      console.error('Document not found');
      this.error.set(true);
      return;
    }
    
    const pdfUrl = this.document()?.fileUrl || `${environment.apiUrl}/api/v1/document/${this.documentId()}/content`;
    
    const container = this.pdfContainer()?.nativeElement;
    if (!container) {
      console.error('PDF container not found');
      this.error.set(true);
      return;
    }
    
    console.log('Loading PDF viewer with URL:', pdfUrl);
    console.log('Container element:', container);

    (window as any).NutrientViewer.load({
      container,
      document: pdfUrl,
      baseUrl: `${location.origin}/assets/pspdfkit/`,
      locale: "en",
      language: "en",
      toolbarItems: [
        { type: "sidebar-thumbnails" },
        { type: "sidebar-bookmarks" },
        { type: "pager" },
        { type: "zoom-out" },
        { type: "zoom-in" },
        { type: "zoom-mode" },
        { type: "spacer" },
        { type: "text-highlighter" },
        { type: "stamp" },
        { type: "ink" },
        { type: "text" },
        { type: "note" },
        { type: "ink-eraser" },
        { type: "pan" },
        { type: "print" },
        { type: "spacer" },
        { type: "export-pdf" }
      ]
    })
    .then((instance: any) => {
      console.log('PDF viewer initialized successfully:', instance);
      this.instance.set(instance);
      this.loading.set(false);
      
      instance.addEventListener("document.change", () => {
        console.log('Document has unsaved changes');
      });
    })
    .catch((error: Error) => {
      console.error('Error loading PDF editor:', error);
      this.error.set(true);
      this.loading.set(false);
    });
  }
  
  private hasUnsavedChanges(): boolean {
    return true;
  }
  
  saveDocument(): void {
    const currentInstance = this.instance();
    if (!currentInstance) return;
    
    currentInstance.exportPDF().then((buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', blob, 'document.pdf');
      
      this.documentService.updateDocument(this.documentId(), formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response: TableItem) => {
            console.log('Document saved successfully:', response);
          },
          error: (error: Error) => {
            console.error('Error saving document:', error);
          }
        });
    });
  }
  
  async backToDocuments(): Promise<void> {
    console.log('Navigating back to documents page');
    
    this.cleanupPdfInstance();
    
    try {
      console.log('Attempting navigation');
      const rootSuccess = await this.router.navigate(['/']);
      console.log('Navigation to root result:', rootSuccess);
      
      if (!rootSuccess) {
        const docsSuccess = await this.router.navigate(['/documents']);
        console.log('Navigation to /documents result:', docsSuccess);
        
        if (!docsSuccess) {
          console.log('Using direct location change');
          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/';
    }
  }
}