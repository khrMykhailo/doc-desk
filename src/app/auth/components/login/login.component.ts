import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, AuthStatus } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.models';
import { computed, signal } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  
  loginForm = this.fb.group({
    email: ['', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.email] 
    }],
    password: ['', { 
      nonNullable: true, 
      validators: [Validators.required] 
    }]
  });
  
  get email() { return this.loginForm.get('email') as FormControl; }
  get password() { return this.loginForm.get('password') as FormControl; }
  
  emailRequired = computed(() => this.email.errors?.['required'] && this.email.touched);
  emailInvalid = computed(() => this.email.errors?.['email'] && this.email.touched);
  passwordRequired = computed(() => this.password.errors?.['required'] && this.password.touched);
  
  hidePassword = signal(true);
  
  formData = computed<LoginRequest>(() => ({
    email: this.email.value,
    password: this.password.value
  }));
  
  isLoading = computed(() => this.authService.authStatus() === AuthStatus.LOADING);
  errorMessage = computed(() => this.authService.authError());
  fieldErrors = computed(() => this.authService.fieldErrors());
  
  constructor() {
    this.authService.resetAuthStatus();
    
    effect(() => {
      if (this.authService.authStatus() === AuthStatus.SUCCESS) {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      }
    });
    
    effect(() => {
      const errors = this.fieldErrors();
      if (Object.keys(errors).length > 0) {
        for (const [field, message] of Object.entries(errors)) {
          const control = this.loginForm.get(field);
          if (control) {
            control.setErrors({ serverError: message });
            control.markAsTouched();
          }
        }
      }
    });
  }
  
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    this.authService.loginWithSignals(this.formData());
  }
  
  togglePasswordVisibility() {
    this.hidePassword.update(value => !value);
  }
} 