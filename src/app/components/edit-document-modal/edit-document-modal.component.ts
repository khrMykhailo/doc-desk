import { Component, inject, DestroyRef, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentService } from '../../shared/services/document.service';
import { DocumentStatus } from '../../shared/enums/document-status.enum';
import { AuthService, UserRole } from '../../shared/services/auth.service';
import { TableItem } from '../../shared/interfaces/main-table.interface';

export interface EditDocumentDialogData {
  documentId: string;
  documentName: string;
  documentStatus: DocumentStatus;
}

@Component({
  selector: 'app-edit-document-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './edit-document-modal.component.html',
  styleUrls: ['./edit-document-modal.component.scss']
})
export class EditDocumentModalComponent {
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<EditDocumentModalComponent>);
  
  documentStatus = DocumentStatus;
  
  documentForm: FormGroup;
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: EditDocumentDialogData) {
    this.documentForm = this.formBuilder.group({
      name: [data.documentName, [Validators.required, Validators.minLength(3), Validators.maxLength(100)]]
    });
  }
  
  isReviewer(): boolean {
    return this.authService.isReviewer();
  }
  
  isUser(): boolean {
    return this.authService.isUser();
  }
  
  canChangeStatus(): boolean {
    return [
      DocumentStatus.READY_FOR_REVIEW,
      DocumentStatus.UNDER_REVIEW
    ].includes(this.data.documentStatus);
  }
  
  canDelete(): boolean {
    return [
      DocumentStatus.DRAFT,
      DocumentStatus.REVOKE,
      DocumentStatus.DECLINED
    ].includes(this.data.documentStatus);
  }
  
  saveChanges(): void {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const newName = this.documentForm.get('name')?.value;

    this.documentService.updateDocumentName(this.data.documentId, newName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set('Error updating document: ' + (error.message || 'Unknown error'));
          console.error('Error updating document:', error);
        }
      });
  }
  
  changeStatus(newStatus: DocumentStatus): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    
    this.documentService.changeDocumentStatus(this.data.documentId, newStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set('Error changing status: ' + (error.message || 'Unknown error'));
          console.error('Error changing status:', error);
        }
      });
  }
  
  revokeDocument(): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    
    this.documentService.revokeDocument(this.data.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set('Error revoking document: ' + (error.message || 'Unknown error'));
          console.error('Error revoking document:', error);
        }
      });
  }
  
  deleteDocument(): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    
    this.documentService.deleteDocument(this.data.documentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.dialogRef.close({ deleted: true });
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set('Error deleting document: ' + (error.message || 'Unknown error'));
          console.error('Error deleting document:', error);
        }
      });
  }
  
  cancel(): void {
    this.dialogRef.close();
  }
  
  getFormControlError(controlName: string): string {
    const control = this.documentForm.get(controlName);
    if (!control || !control.errors) return '';
    
    if (control.errors['required']) {
      return 'This field is required';
    }
    
    if (control.errors['minlength']) {
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    }
    
    if (control.errors['maxlength']) {
      return `Maximum length is ${control.errors['maxlength'].requiredLength} characters`;
    }
    
    return 'Invalid value';
  }
} 