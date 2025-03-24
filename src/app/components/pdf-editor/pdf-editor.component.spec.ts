import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ElementRef } from '@angular/core';
import { PdfEditorComponent } from './pdf-editor.component';
import { DocumentService } from '../../shared/services/document.service';
import { AuthService } from '../../shared/services/auth.service';
import { DocumentStatus } from '../../shared/enums/document-status.enum';
import { TableItem } from '../../shared/interfaces/main-table.interface';
import { environment } from '../../../environments/environment';

// Mock instance and viewer
const mockInstance = {
  dispose: jasmine.createSpy('dispose'),
  exportPDF: jasmine.createSpy('exportPDF').and.returnValue(Promise.resolve(new ArrayBuffer(0))),
  setViewState: jasmine.createSpy('setViewState')
};

const mockNutrientViewer = {
  load: jasmine.createSpy('load').and.returnValue(Promise.resolve(mockInstance))
};

describe('PdfEditorComponent', () => {
  let component: PdfEditorComponent;
  let fixture: ComponentFixture<PdfEditorComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockActivatedRoute: any;
  
  // Reset mock call counters before each test
  beforeEach(() => {
    mockNutrientViewer.load.calls.reset();
    mockInstance.dispose.calls.reset();
    mockInstance.exportPDF.calls.reset();
    mockInstance.setViewState.calls.reset();
  });
  
  const mockDocument: TableItem = {
    id: '123',
    name: 'Test Document',
    status: DocumentStatus.APPROVED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fileUrl: 'http://test.com/document.pdf',
    creator: {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'user'
    }
  };

  beforeEach(async () => {
    mockDocumentService = jasmine.createSpyObj('DocumentService', ['getDocumentById', 'updateDocument']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['isReviewer', 'isUser']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({ id: '123' }))
    };
    
    mockDocumentService.getDocumentById.and.returnValue(of(mockDocument));
    mockAuthService.isReviewer.and.returnValue(false);
    mockAuthService.isUser.and.returnValue(true);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));
    
    spyOn(PdfEditorComponent.prototype as any, 'loadPdfEditor').and.callFake(function(this: PdfEditorComponent) {
      this.instance.set(mockInstance);
      this.loading.set(false);
    });
    
    await TestBed.configureTestingModule({
      imports: [PdfEditorComponent],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PdfEditorComponent);
    component = fixture.componentInstance;
    
    const mockElement = document.createElement('div');
    component['pdfContainer'] = { nativeElement: mockElement } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load document on init', fakeAsync(() => {
    fixture.detectChanges(); 
    tick(); 
    
    expect(mockDocumentService.getDocumentById).toHaveBeenCalledWith('123');
    expect(component.document()).toEqual(mockDocument);
    expect(component.loading()).toBeFalse();
  }));

  it('should handle document load error', fakeAsync(() => {
    mockDocumentService.getDocumentById.and.returnValue(throwError(() => new Error('Test error')));
    fixture.detectChanges();
    tick();
    
    expect(component.error()).toBeTrue();
  }));

  it('should provide appropriate toolbar items based on user role', () => {
    mockAuthService.isReviewer.and.returnValue(false);
    let toolbarItems = component['getToolbarItems']();
    expect(toolbarItems.length).toBe(6); 
    
    mockAuthService.isReviewer.and.returnValue(true);
    toolbarItems = component['getToolbarItems']();
    expect(toolbarItems.length).toBeGreaterThan(6);
  });

  it('should navigate back to documents list', async () => {
    component.instance.set(mockInstance);
    
    await component.backToDocuments();
    
    expect(mockInstance.dispose).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should cleanup PDF instance on navigation', async () => {
    component.instance.set(mockInstance);
    
    await component.backToDocuments();
    
    expect(mockInstance.dispose).toHaveBeenCalled();
    expect(component.instance()).toBeNull();
  });

  it('should handle non-standard PDF instance cleanup methods', async () => {
    const nonStandardInstances = [
      { close: jasmine.createSpy('close') },
      { destroy: jasmine.createSpy('destroy') },
      { unload: jasmine.createSpy('unload') }
    ];
    
    for (const inst of nonStandardInstances) {
      component.instance.set(inst);
      component['cleanupPdfInstance']();
      
      const method = Object.keys(inst)[0] as keyof typeof inst;
      expect(inst[method]).toHaveBeenCalled();
    }
  });

  it('should return correct user role status', () => {
    mockAuthService.isUser.and.returnValue(true);
    mockAuthService.isReviewer.and.returnValue(false);
    
    expect(component.isUser()).toBeTrue();
    expect(component.isReviewer()).toBeFalse();
  });

  it('should determine if user can edit document', () => {
    mockAuthService.isUser.and.returnValue(true);
    component.document.set(mockDocument);
    expect(component.canEdit()).toBeTrue();
    
    mockAuthService.isUser.and.returnValue(false);
    expect(component.canEdit()).toBeFalse();
    
    mockAuthService.isUser.and.returnValue(true);
    component.document.set(undefined);
    expect(component.canEdit()).toBeFalse();
  });
});
