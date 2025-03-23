import { Component, inject, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentService } from '../../shared/services/document.service';
import { DocumentStatus } from '../../shared/enums/document-status.enum';
import { DocumentFormData } from '../../shared/interfaces/document-form.interface';

@Component({
  selector: 'app-add-document-modal',
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
  templateUrl: './add-document-modal.component.html',
  styleUrls: ['./add-document-modal.component.scss']
})
export class AddDocumentModalComponent {
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private dialogRef = inject(MatDialogRef<AddDocumentModalComponent>);

  documentForm: FormGroup;
  selectedFile = signal<File | null>(null);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor() {
    this.documentForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      file: [null, Validators.required]
    });
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (file.type !== 'application/pdf') {
        this.errorMessage.set('Only PDF files are supported');
        this.documentForm.get('file')?.setErrors({ invalidFileType: true });
        return;
      }
      
      this.selectedFile.set(file);
      this.documentForm.patchValue({ file: file });
      this.documentForm.get('file')?.updateValueAndValidity();
      this.errorMessage.set('');
    }
  }

  saveAsDraft(): void {
    if (this.documentForm.invalid || !this.selectedFile()) {
      this.documentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formData = new FormData();
    formData.append('name', this.documentForm.get('name')?.value);
    formData.append('status', DocumentStatus.DRAFT);
    formData.append('file', this.selectedFile()!);

    this.documentService.createDocument(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set('Error creating document: ' + (error.message || 'Unknown error'));
          console.error('Error creating document:', error);
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
    
    if (control.errors['invalidFileType']) {
      return 'Only PDF files are supported';
    }
    
    return 'Invalid value';
  }
}
