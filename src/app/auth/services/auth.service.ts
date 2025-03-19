import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.models';
import { TokenService } from './token.service';

export enum AuthStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  error: string;
  fieldErrors: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  
  private readonly apiUrl = 'https://legaltech-testing.coobrick.app/api/v1';
  
  private readonly state = signal<AuthState>({
    status: AuthStatus.IDLE,
    user: null,
    error: '',
    fieldErrors: {}
  });
  
  readonly authStatus = computed(() => this.state().status);
  readonly currentUser = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => !!this.state().user || this.tokenService.getAccessToken() !== null);
  readonly authError = computed(() => this.state().error);
  readonly fieldErrors = computed(() => this.state().fieldErrors);
  
  constructor() {
    this.loadUserFromToken();
  }
  
  loginWithSignals(credentials: LoginRequest): void {
    this.resetAuthStatus();
    
    this.updateState({ status: AuthStatus.LOADING });
    
    this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .subscribe({
        next: (response) => {
          this.handleAuth(response);
          this.updateState({ status: AuthStatus.SUCCESS });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Login failed', error);
          this.handleAuthError(error, 'Invalid credentials');
        }
      });
  }
  
  registerWithSignals(userData: RegisterRequest): void {
    this.resetAuthStatus();
    
    this.updateState({ status: AuthStatus.LOADING });
    
    this.http.post<AuthResponse>(`${this.apiUrl}/user/register`, userData)
      .subscribe({
        next: (response) => {
          this.handleAuth(response);
          this.updateState({ status: AuthStatus.SUCCESS });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Registration failed', error);
          this.handleAuthError(error, 'Registration failed');
        }
      });
  }
  
  logout(): void {
    this.tokenService.clearTokens();
    this.resetAuthStatus();
    this.updateState({ user: null });
    this.router.navigate(['/login']);
  }
  
  resetAuthStatus(): void {
    this.updateState({
      status: AuthStatus.IDLE,
      error: '',
      fieldErrors: {}
    });
  }
  
  private updateState(partialState: Partial<AuthState>): void {
    this.state.update(state => ({
      ...state,
      ...partialState
    }));
  }
  
  private handleAuthError(error: HttpErrorResponse, defaultMessage: string): void {
    const errorMsg = error.error?.message || defaultMessage;
    
    const newFieldErrors: Record<string, string> = {};
    
    if (errorMsg.toLowerCase().includes('email')) {
      newFieldErrors['email'] = 'Invalid email format or email already exists';
    }
    
    if (errorMsg.toLowerCase().includes('password')) {
      newFieldErrors['password'] = 'Password does not meet requirements';
    }
    
    this.updateState({
      status: AuthStatus.ERROR,
      error: errorMsg,
      fieldErrors: newFieldErrors
    });
  }
  
  private handleAuth(response: AuthResponse): void {
    this.tokenService.saveTokens(response.access_token);
    
    try {
      const user = this.tokenService.getUserFromToken(response.access_token);
      if (user) {
        this.updateState({ user });
      }
    } catch (e) {
      console.error('Error decoding token', e);
    }
  }
  
  private loadUserFromToken(): void {
    const token = this.tokenService.getAccessToken();
    
    if (token) {
      if (this.tokenService.isTokenExpired()) {
        this.logout();
        return;
      }
      
      try {
        const user = this.tokenService.getUserFromToken(token);
        if (user) {
          this.updateState({ user });
        }
      } catch (e) {
        console.error('Invalid token', e);
        this.logout();
      }
    }
  }
} 