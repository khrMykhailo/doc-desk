import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { DocumentService } from '../../shared/services/document.service';
import { DocumentStatus } from '../../shared/enums/document-status.enum';
import { AddDocumentModalComponent } from './add-document-modal.component';

describe('AddDocumentModalComponent', () => {
  let component: AddDocumentModalComponent;
  let fixture: ComponentFixture<AddDocumentModalComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddDocumentModalComponent>>;
  let mockFile: File;

  beforeEach(async () => {
    const blob = new Blob(['test pdf content'], { type: 'application/pdf' });
    mockFile = new File([blob], 'test.pdf', { type: 'application/pdf' });

    mockDocumentService = jasmine.createSpyObj('DocumentService', ['createDocument']);
    
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        AddDocumentModalComponent,
        ReactiveFormsModule
      ],
      providers: [
        FormBuilder,
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddDocumentModalComponent);
    component = fixture.componentInstance;
    
    mockDocumentService.createDocument.and.returnValue(of({
      id: '123',
      name: 'Test Document',
      status: DocumentStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an empty form', () => {
    expect(component.documentForm).toBeDefined();
    expect(component.documentForm.get('name')?.value).toBeFalsy();
    expect(component.documentForm.get('file')?.value).toBeFalsy();
    expect(component.documentForm.invalid).toBeTrue();
  });

  it('should validate form fields', () => {
    expect(component.documentForm.valid).toBeFalse();
    
    component.documentForm.get('name')?.setValue('Test Document');
    expect(component.documentForm.valid).toBeFalse();
    
    component.documentForm.get('file')?.setValue(mockFile);
    expect(component.documentForm.valid).toBeTrue();
    
    component.documentForm.get('name')?.setValue('');
    expect(component.documentForm.valid).toBeFalse();
    expect(component.documentForm.get('name')?.hasError('required')).toBeTrue();
  });

  it('should set selected file when file is selected', () => {
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    } as unknown as Event;
    
    component.onFileSelected(mockEvent);
    
    expect(component.selectedFile()).toEqual(mockFile);
    expect(component.documentForm.get('file')?.value).toEqual(mockFile);
  });

  it('should close dialog when cancel is clicked', () => {
    component.cancel();
    
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should not save as draft when form is invalid', () => {
    component.saveAsDraft();
    
    expect(mockDocumentService.createDocument).not.toHaveBeenCalled();
    expect(component.documentForm.touched).toBeTrue();
  });

  it('should save document as draft when form is valid', fakeAsync(() => {
    component.documentForm.get('name')?.setValue('Test Document');
    component.selectedFile.set(mockFile);
    component.documentForm.get('file')?.setValue(mockFile);
    
    component.saveAsDraft();
    tick();
    
    expect(mockDocumentService.createDocument).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalled();
  }));

  it('should submit document for review when form is valid', fakeAsync(() => {
    component.documentForm.get('name')?.setValue('Test Document');
    component.selectedFile.set(mockFile);
    component.documentForm.get('file')?.setValue(mockFile);
    
    component.submitForReview();
    tick();
    
    expect(mockDocumentService.createDocument).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalled();
  }));

  it('should handle error when saving document fails', fakeAsync(() => {
    mockDocumentService.createDocument.and.returnValue(
      throwError(() => new Error('Upload failed'))
    );
    
    component.documentForm.get('name')?.setValue('Test Document');
    component.selectedFile.set(mockFile);
    component.documentForm.get('file')?.setValue(mockFile);
    
    component.saveAsDraft();
    tick();
    
    expect(component.errorMessage().length).toBeGreaterThan(0);
    expect(component.isSubmitting()).toBeFalse();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  }));

  it('should display form validation errors', () => {
    component.documentForm.get('name')?.markAsTouched();
    expect(component.getFormControlError('name')).toContain('required');
    
    component.documentForm.get('file')?.markAsTouched();
    expect(component.getFormControlError('file')).toContain('required');
  });

  it('should disable buttons during submission', () => {
    component.documentForm.get('name')?.setValue('Test Document');
    component.selectedFile.set(mockFile);
    component.documentForm.get('file')?.setValue(mockFile);
    
    component.isSubmitting.set(true);
    fixture.detectChanges();
    
    const saveButton = fixture.nativeElement.querySelector('button[color="primary"]');
    const submitButton = fixture.nativeElement.querySelector('button[color="accent"]');
    const cancelButton = fixture.nativeElement.querySelector('button[mat-button]');
    
    expect(component.isSubmitting()).toBeTrue();
    
    expect(cancelButton.hasAttribute('disabled')).toBeTrue();
    expect(component.documentForm.valid && !component.isSubmitting()).toBeFalse();
  });
});
