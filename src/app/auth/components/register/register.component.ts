import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators, FormBuilder } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AuthService, AuthStatus } from '../../services/auth.service';
import { RegisterRequest, UserRole } from '../../models/auth.models';
import { computed, signal } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  
  userRoles = UserRole;
  
  availableRoles = computed(() => [
    { value: UserRole.USER, label: 'User' },
    { value: UserRole.REVIEWER, label: 'Reviewer' }
  ]);
  
  registerForm = this.fb.group({
    email: ['', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.email] 
    }],
    password: ['', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.minLength(6)] 
    }],
    confirmPassword: ['', { 
      nonNullable: true, 
      validators: [Validators.required] 
    }],
    fullName: ['', { 
      nonNullable: true, 
      validators: [Validators.required] 
    }],
    role: [UserRole.USER, { 
      nonNullable: true, 
      validators: [Validators.required] 
    }]
  }, {
    validators: [this.passwordMatchValidator()]
  });
  
  get email() { return this.registerForm.get('email') as FormControl; }
  get password() { return this.registerForm.get('password') as FormControl; }
  get confirmPassword() { return this.registerForm.get('confirmPassword') as FormControl; }
  get fullName() { return this.registerForm.get('fullName') as FormControl; }
  get role() { return this.registerForm.get('role') as FormControl; }
  
  emailRequired = computed(() => this.email.errors?.['required'] && this.email.touched);
  emailInvalid = computed(() => this.email.errors?.['email'] && this.email.touched);
  passwordRequired = computed(() => this.password.errors?.['required'] && this.password.touched);
  passwordTooShort = computed(() => this.password.errors?.['minlength'] && this.password.touched);
  confirmPasswordRequired = computed(() => this.confirmPassword.errors?.['required'] && this.confirmPassword.touched);
  passwordsDoNotMatch = computed(() => 
    this.registerForm.errors?.['passwordMismatch'] && 
    this.confirmPassword.touched && 
    this.password.touched
  );
  fullNameRequired = computed(() => this.fullName.errors?.['required'] && this.fullName.touched);
  roleRequired = computed(() => this.role.errors?.['required'] && this.role.touched);
  
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  
  formData = computed<RegisterRequest>(() => ({
    email: this.email.value,
    password: this.password.value,
    fullName: this.fullName.value,
    role: this.role.value
  }));
  
  isLoading = computed(() => this.authService.authStatus() === AuthStatus.LOADING);
  errorMessage = computed(() => this.authService.authError());
  fieldErrors = computed(() => this.authService.fieldErrors());
  
  constructor() {
    this.authService.resetAuthStatus();
    
    effect(() => {
      if (this.authService.authStatus() === AuthStatus.SUCCESS) {
        this.router.navigate(['/']);
      }
    });
    
    effect(() => {
      const errors = this.fieldErrors();
      if (Object.keys(errors).length > 0) {
        for (const [field, message] of Object.entries(errors)) {
          const control = this.registerForm.get(field);
          if (control) {
            control.setErrors({ serverError: message });
            control.markAsTouched();
          }
        }
      }
    });
  }
  
  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');
      
      if (password && confirmPassword && password.value !== confirmPassword.value) {
        return { passwordMismatch: true };
      }
      
      return null;
    };
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    
    this.authService.registerWithSignals(this.formData());
  }
  
  togglePasswordVisibility() {
    this.hidePassword.update(value => !value);
  }
  
  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword.update(value => !value);
  }
} 