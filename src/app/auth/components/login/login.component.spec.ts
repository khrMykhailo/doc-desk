import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, AuthStatus } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.models';
import { LoginComponent } from './login.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'loginWithSignals',
      'resetAuthStatus',
      'authStatus',
      'authError',
      'fieldErrors'
    ]);
    
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    
    mockActivatedRoute = {
      snapshot: {
        queryParams: {}
      }
    };
    
    mockAuthService.authStatus.and.returnValue(AuthStatus.IDLE);
    mockAuthService.authError.and.returnValue('');
    mockAuthService.fieldErrors.and.returnValue({});
    
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty fields', () => {
    expect(component.email.value).toBe('');
    expect(component.password.value).toBe('');
    expect(component.loginForm.valid).toBeFalse();
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

  it('should toggle password visibility', () => {
    expect(component.hidePassword()).toBeTrue();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBeFalse();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBeTrue();
  });

  it('should not call login service when form is invalid', () => {
    component.onSubmit();
    expect(mockAuthService.loginWithSignals).not.toHaveBeenCalled();
  });

  it('should call login service when form is valid', () => {
    const validData: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    component.email.setValue(validData.email);
    component.password.setValue(validData.password);
    expect(component.loginForm.valid).toBeTrue();
    
    component.onSubmit();
    expect(mockAuthService.loginWithSignals).toHaveBeenCalledWith(validData);
  });

  it('should show loading state when auth status is loading', () => {
    mockAuthService.authStatus.and.returnValue(AuthStatus.LOADING);
    
    expect(component.isLoading()).toBeTrue();
  });

  it('should display error messages from server', () => {
    const errorMessage = 'Invalid credentials';
    mockAuthService.authError.and.returnValue(errorMessage);
    
    expect(component.errorMessage()).toBe(errorMessage);
  });
}); 