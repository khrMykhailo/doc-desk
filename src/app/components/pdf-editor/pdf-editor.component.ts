import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, inject, DestroyRef, input, viewChild, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, from, switchMap, tap, catchError, of } from 'rxjs';
import { DocumentService } from '../../shared/services/document.service';
import { AuthService } from '../../shared/services/auth.service';
import { TableItem } from '../../shared/interfaces/main-table.interface';
import { DocumentStatus } from '../../shared/enums/document-status.enum';
import { environment } from '../../../environments/environment';
import { EditDocumentModalComponent } from '../edit-document-modal/edit-document-modal.component';
import NutrientViewer from '@nutrient-sdk/viewer';


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
export class PdfEditorComponent implements AfterViewInit, OnDestroy {
  pdfContainer = viewChild<ElementRef<HTMLDivElement>>('pdfContainer');
  documentId = input<string>('');
  
  private destroyRef = inject(DestroyRef);
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  
  document = signal<TableItem | undefined>(undefined);
  instance = signal<any>(null);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);
  
  ngAfterViewInit(): void {
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

    NutrientViewer.load({
      container,
      document: pdfUrl,
      baseUrl: `${location.origin}/assets/pspdfkit/`,
      locale: "en",
      toolbarItems: this.getToolbarItems(),
    })
    .then((instance: any) => {
      this.instance.set(instance);
      this.loading.set(false);
    })
    .catch((error: Error) => {
      console.error('Error loading PDF viewer:', error);
      this.error.set(true);
      this.loading.set(false);
    });
  }
  
  private getToolbarItems(): any[] {
    const baseItems = [
      { type: "sidebar-thumbnails" },
      { type: "sidebar-bookmarks" },
      { type: "pager" },
      { type: "zoom-out" },
      { type: "zoom-in" },
      { type: "print" },
    ];
    
    // Only show edit tools for reviewers
    if (this.authService.isReviewer()) {
      return [
        ...baseItems,
        { type: "text-highlighter" },
        { type: "stamp" },
        { type: "ink" },
        { type: "text" },
        { type: "note" },
        { type: "ink-eraser" },
        { type: "spacer" }
      ];
    }
    
    return baseItems;
  }
  
  editDocument(): void {
    if (!this.document()) return;
    
    const dialogRef = this.dialog.open(EditDocumentModalComponent, {
      width: '500px',
      data: {
        documentId: this.document()!.id,
        documentName: this.document()!.name,
        documentStatus: this.document()!.status
      }
    });
    
    dialogRef.afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result) {
        this.documentService.getDocumentById(this.document()!.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(updatedDoc => {
            this.document.set(updatedDoc);
          });
      }
    });
  }
  
  isUser(): boolean {
    return this.authService.isUser();
  }
  
  isReviewer(): boolean {
    return this.authService.isReviewer();
  }
  
  canEdit(): boolean {
    return this.isUser() && this.document() !== undefined;
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