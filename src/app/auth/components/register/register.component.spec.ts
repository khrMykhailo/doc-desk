import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RegisterComponent } from './register.component';
import { AuthService, AuthStatus } from '../../services/auth.service';
import { RegisterRequest, UserRole } from '../../models/auth.models';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'registerWithSignals',
      'resetAuthStatus',
      'authStatus',
      'authError',
      'fieldErrors'
    ]);
    
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    
    mockAuthService.authStatus.and.returnValue(AuthStatus.IDLE);
    mockAuthService.authError.and.returnValue('');
    mockAuthService.fieldErrors.and.returnValue({});
    
    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatSelectModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    expect(component.email.value).toBe('');
    expect(component.password.value).toBe('');
    expect(component.confirmPassword.value).toBe('');
    expect(component.fullName.value).toBe('');
    expect(component.role.value).toBe(UserRole.USER);
    expect(component.registerForm.valid).toBeFalse();
  });

  it('should show validation error when email is invalid', () => {
    component.email.setValue('invalid-email');
    component.email.markAsTouched();
    
    expect(component.emailInvalid()).toBeTrue();
    expect(component.email.hasError('email')).toBeTrue();
  });

  it('should show validation error when email is required', () => {
    component.email.setValue('');
    component.email.markAsTouched();
    
    expect(component.emailRequired()).toBeTrue();
    expect(component.email.hasError('required')).toBeTrue();
  });

  it('should show validation error when password is required', () => {
    component.password.setValue('');
    component.password.markAsTouched();
    
    expect(component.passwordRequired()).toBeTrue();
    expect(component.password.hasError('required')).toBeTrue();
  });
  
  it('should show validation error when password is too short', () => {
    component.password.setValue('12345');
    component.password.markAsTouched();
    
    expect(component.passwordTooShort()).toBeTrue();
    expect(component.password.hasError('minlength')).toBeTrue();
  });
  
  it('should show validation error when confirmPassword is required', () => {
    component.confirmPassword.setValue('');
    component.confirmPassword.markAsTouched();
    
    expect(component.confirmPasswordRequired()).toBeTrue();
    expect(component.confirmPassword.hasError('required')).toBeTrue();
  });
  
  it('should show validation error when passwords do not match', () => {
    component.password.setValue('password123');
    component.confirmPassword.setValue('password456');
    
    component.password.markAsTouched();
    component.confirmPassword.markAsTouched();
    
    expect(component.passwordsDoNotMatch()).toBeTrue();
    expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();
  });
  
  it('should not show password mismatch error when passwords match', () => {
    component.password.setValue('password123');
    component.confirmPassword.setValue('password123');
    
    component.password.markAsTouched();
    component.confirmPassword.markAsTouched();
    
    expect(component.passwordsDoNotMatch()).toBeFalse();
    expect(component.registerForm.hasError('passwordMismatch')).toBeFalse();
  });
  
  it('should show validation error when fullName is required', () => {
    component.fullName.setValue('');
    component.fullName.markAsTouched();
    
    expect(component.fullNameRequired()).toBeTrue();
    expect(component.fullName.hasError('required')).toBeTrue();
  });
  
  it('should toggle password visibility', () => {
    expect(component.hidePassword()).toBeTrue();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBeFalse();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBeTrue();
  });
  
  it('should toggle confirm password visibility', () => {
    expect(component.hideConfirmPassword()).toBeTrue();
    
    component.toggleConfirmPasswordVisibility();
    expect(component.hideConfirmPassword()).toBeFalse();
    
    component.toggleConfirmPasswordVisibility();
    expect(component.hideConfirmPassword()).toBeTrue();
  });

  it('should not call register service when form is invalid', () => {
    component.onSubmit();
    expect(mockAuthService.registerWithSignals).not.toHaveBeenCalled();
  });

  it('should call register service when form is valid', () => {
    component.email.setValue('test@example.com');
    component.password.setValue('password123');
    component.confirmPassword.setValue('password123');
    component.fullName.setValue('Test User');
    component.role.setValue(UserRole.USER);
    
    expect(component.registerForm.valid).toBeTrue();
    
    component.onSubmit();
    
    const expectedData: RegisterRequest = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      role: UserRole.USER
    };
    
    expect(mockAuthService.registerWithSignals).toHaveBeenCalledWith(expectedData);
  });

  it('should show loading state when auth status is loading', () => {
    mockAuthService.authStatus.and.returnValue(AuthStatus.LOADING);
    
    expect(component.isLoading()).toBeTrue();
  });

  it('should display error messages from server', () => {
    const errorMessage = 'Registration failed';
    mockAuthService.authError.and.returnValue(errorMessage);
    
    expect(component.errorMessage()).toBe(errorMessage);
  });
}); 