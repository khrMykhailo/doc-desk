import { Component, inject, DestroyRef, signal, computed, Input, Inject } from '@angular/core';
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
  template: `
    <h2 mat-dialog-title>Edit Document</h2>
    <div mat-dialog-content>
      <form [formGroup]="documentForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Document Title</mat-label>
          <input matInput formControlName="name" placeholder="Enter document title">
          @if (documentForm.get('name')?.errors) {
            <mat-error>{{ getFormControlError('name') }}</mat-error>
          }
        </mat-form-field>
        
        @if (isReviewer() && canChangeStatus()) {
          <div class="status-section">
            <h3>Change Status</h3>
            <div class="status-actions">
              @if (data.documentStatus === documentStatus.READY_FOR_REVIEW) {
                <button mat-raised-button color="primary" (click)="changeStatus(documentStatus.UNDER_REVIEW)" [disabled]="isSubmitting()">
                  <mat-icon>assignment</mat-icon> Start Review
                </button>
              }
              
              @if (data.documentStatus === documentStatus.UNDER_REVIEW) {
                <button mat-raised-button color="accent" (click)="changeStatus(documentStatus.APPROVED)" [disabled]="isSubmitting()">
                  <mat-icon>check_circle</mat-icon> Approve
                </button>
                <button mat-raised-button color="warn" (click)="changeStatus(documentStatus.DECLINED)" [disabled]="isSubmitting()">
                  <mat-icon>cancel</mat-icon> Decline
                </button>
              }
            </div>
          </div>
        }
        
        @if (isUser() && data.documentStatus === documentStatus.READY_FOR_REVIEW) {
          <div class="status-section">
            <button mat-raised-button color="warn" (click)="revokeDocument()" [disabled]="isSubmitting()">
              <mat-icon>undo</mat-icon> Revoke Document
            </button>
          </div>
        }
        
        @if (isUser() && canDelete()) {
          <div class="status-section">
            <button mat-raised-button color="warn" (click)="deleteDocument()" [disabled]="isSubmitting()">
              <mat-icon>delete</mat-icon> Delete Document
            </button>
          </div>
        }

        @if (errorMessage()) {
          <div class="error-message">
            {{ errorMessage() }}
          </div>
        }
      </form>

      @if (isSubmitting()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button [disabled]="isSubmitting()" (click)="cancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="isSubmitting() || documentForm.invalid || !documentForm.dirty" (click)="saveChanges()">
        <mat-icon>save</mat-icon> Save Changes
      </button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    .error-message {
      color: #f44336;
      margin: 10px 0;
    }
    
    .status-section {
      margin-top: 20px;
      margin-bottom: 20px;
    }
    
    .status-actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
  `]
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
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }
    
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