import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormatStatusPipe } from '../../shared/pipes';
import { MainTableComponent } from './main-table.component';
import { DocumentService } from '../../shared/services/document.service';
import { AuthService, UserRole } from '../../shared/services/auth.service';
import { DocumentStatus } from '../../shared/enums/document-status.enum';
import { TableItem } from '../../shared/interfaces/main-table.interface';
import { DocumentApiResponse } from '../../shared/interfaces/document-response.interface';
import { AddDocumentModalComponent } from '../add-document-modal/add-document-modal.component';
import { EditDocumentModalComponent } from '../edit-document-modal/edit-document-modal.component';
import { PageEvent } from '@angular/material/paginator';

describe('MainTableComponent', () => {
  let component: MainTableComponent;
  let fixture: ComponentFixture<MainTableComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockActivatedRoute: any;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;

  const mockDocuments: TableItem[] = [
    {
      id: '1',
      name: 'Document 1',
      status: DocumentStatus.DRAFT,
      createdAt: '2023-01-01T12:00:00Z',
      updatedAt: '2023-01-01T12:00:00Z',
      fileUrl: 'https://example.com/doc1.pdf'
    },
    {
      id: '2',
      name: 'Document 2',
      status: DocumentStatus.READY_FOR_REVIEW,
      createdAt: '2023-01-02T12:00:00Z',
      updatedAt: '2023-01-02T12:00:00Z',
      fileUrl: 'https://example.com/doc2.pdf'
    },
    {
      id: '3',
      name: 'Document 3',
      status: DocumentStatus.APPROVED,
      createdAt: '2023-01-03T12:00:00Z',
      updatedAt: '2023-01-03T12:00:00Z',
      fileUrl: 'https://example.com/doc3.pdf',
      creator: {
        id: '123',
        email: 'user@example.com',
        fullName: 'Test User',
        role: 'USER'
      }
    }
  ];

  const mockApiResponse: DocumentApiResponse = {
    count: mockDocuments.length,
    results: mockDocuments
  };

  const setupUserRole = (role: UserRole) => {
    mockAuthService.currentRole.and.returnValue(role);
    mockAuthService.isUser.and.returnValue(role === UserRole.USER);
    mockAuthService.isReviewer.and.returnValue(role === UserRole.REVIEWER);
  };

  beforeEach(async () => {
    mockDocumentService = jasmine.createSpyObj('DocumentService', [
      'getDocuments',
      'submitForReview',
      'revokeDocument',
      'deleteDocument',
      'changeDocumentStatus'
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'currentRole',
      'isUser',
      'isReviewer'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    
    mockActivatedRoute = {
      data: of({ documents: mockApiResponse })
    };
    
    mockDocumentService.getDocuments.and.returnValue(of(mockApiResponse));
    mockDialogRef.afterClosed.and.returnValue(of(null));
    mockDialog.open.and.returnValue(mockDialogRef);
    
    setupUserRole(UserRole.USER);

    await TestBed.configureTestingModule({
      imports: [
        MainTableComponent,
        NoopAnimationsModule,
        FormatStatusPipe
      ],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load documents on initialization', () => {
    expect(component.documentsData()).toEqual(mockApiResponse);
    expect(component.totalItems()).toBe(mockDocuments.length);
  });

  it('should update displayed columns based on user role', () => {
    setupUserRole(UserRole.USER);
    component.updateDisplayedColumns();
    expect(component.displayedColumns()).toContain('file');
    expect(component.displayedColumns()).toContain('status');
    expect(component.displayedColumns()).toContain('updatedAt');
    expect(component.displayedColumns()).toContain('actions');
    expect(component.displayedColumns()).not.toContain('creator');
    
    setupUserRole(UserRole.REVIEWER);
    component.updateDisplayedColumns();
    expect(component.displayedColumns()).toContain('creator');
  });

  it('should handle pagination', () => {
    const pageEvent: PageEvent = {
      pageIndex: 1,
      pageSize: 5,
      length: mockDocuments.length
    };
    
    component.onPageChange(pageEvent);
    
    expect(component.pageIndex()).toBe(1);
    expect(component.pageSize()).toBe(5);
  });

  it('should submit document for review as user', fakeAsync(() => {
    setupUserRole(UserRole.USER);
    const document = mockDocuments[0];
    mockDocumentService.submitForReview.and.returnValue(of({
      ...document,
      status: DocumentStatus.READY_FOR_REVIEW
    }));
    
    component.submitForReview(document);
    tick();
    
    expect(mockDocumentService.submitForReview).toHaveBeenCalledWith(document.id);
  }));

  it('should revoke document as user', fakeAsync(() => {
    setupUserRole(UserRole.USER);
    const document = mockDocuments[1];
    mockDocumentService.revokeDocument.and.returnValue(of({
      ...document,
      status: DocumentStatus.REVOKE
    }));
    
    component.revokeDocument(document);
    tick();
    
    expect(mockDocumentService.revokeDocument).toHaveBeenCalledWith(document.id);
  }));

  it('should delete document as user', fakeAsync(() => {
    setupUserRole(UserRole.USER);
    const document = mockDocuments[0];
    mockDocumentService.deleteDocument.and.returnValue(of(void 0));
    
    component.deleteItem(document);
    tick();
    
    expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(document.id);
  }));

  it('should change document status as reviewer', fakeAsync(() => {
    setupUserRole(UserRole.REVIEWER);
    const document = mockDocuments[1];
    const newStatus = DocumentStatus.UNDER_REVIEW;
    mockDocumentService.changeDocumentStatus.and.returnValue(of({
      ...document,
      status: newStatus
    }));
    
    component.changeStatus(document, newStatus);
    tick();
    
    expect(mockDocumentService.changeDocumentStatus).toHaveBeenCalledWith(document.id, newStatus);
  }));

  it('should handle errors when loading documents', fakeAsync(() => {
    mockDocumentService.getDocuments.and.returnValue(throwError(() => new Error('Server error')));
    
    component.refreshData();
    tick();
    
    expect(component.documentsData().count).toBeDefined();
    expect(Array.isArray(component.documentsData().results)).toBeTrue();
  }));

  it('should determine if user can submit document for review', () => {
    setupUserRole(UserRole.USER);
    
    expect(component.canSubmitForReview(DocumentStatus.DRAFT)).toBeTrue();
    
    expect(component.canSubmitForReview(DocumentStatus.READY_FOR_REVIEW)).toBeFalse();
    expect(component.canSubmitForReview(DocumentStatus.UNDER_REVIEW)).toBeFalse();
  });

  it('should determine if user can revoke document', () => {
    setupUserRole(UserRole.USER);
    
    expect(component.canRevoke(DocumentStatus.READY_FOR_REVIEW)).toBeTrue();
    
    expect(component.canRevoke(DocumentStatus.DRAFT)).toBeFalse();
    expect(component.canRevoke(DocumentStatus.UNDER_REVIEW)).toBeFalse();
  });

  it('should determine if user can delete document', () => {
    setupUserRole(UserRole.USER);
    
    expect(component.canDelete(DocumentStatus.DRAFT)).toBeTrue();
    expect(component.canDelete(DocumentStatus.DECLINED)).toBeTrue();
  });

  it('should format date correctly', () => {
    const dateString = '2023-01-01T12:00:00Z';
    const result = component.formatDate(dateString);
    
    expect(result).toContain('2023');
    expect(typeof result).toBe('string');
  });

  it('should get correct status class', () => {
    expect(component.getStatusClass(DocumentStatus.DRAFT)).toBe('status-draft');
    expect(component.getStatusClass(DocumentStatus.READY_FOR_REVIEW)).toBe('status-ready-for-review');
  });

  xit('should open add document dialog as a user', () => {
    setupUserRole(UserRole.USER);
    
    component.addNewItem();
    
    expect(mockDialog.open).toHaveBeenCalled();
  });

  xit('should open edit document dialog', () => {
    const document = mockDocuments[0];
    
    component.editItem(document);
    
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should not allow non-users to add documents', () => {
    setupUserRole(UserRole.REVIEWER);
    
    component.addNewItem();
    
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it('should navigate to document view', () => {
    const document = mockDocuments[0];
    
    component.viewItem(document);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents', document.id, 'view']);
  });

  it('should not allow non-users to submit documents for review', () => {
    setupUserRole(UserRole.REVIEWER);
    const document = mockDocuments[0];
    
    component.submitForReview(document);
    
    expect(mockDocumentService.submitForReview).not.toHaveBeenCalled();
  });

  it('should not allow non-reviewers to change document status', () => {
    setupUserRole(UserRole.USER);
    const document = mockDocuments[1];
    
    component.changeStatus(document, DocumentStatus.UNDER_REVIEW);
    
    expect(mockDocumentService.changeDocumentStatus).not.toHaveBeenCalled();
  });
});
