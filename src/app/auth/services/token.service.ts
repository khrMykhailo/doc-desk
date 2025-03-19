import { Injectable } from '@angular/core';
import { User } from '../models/auth.models';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  
  saveTokens(accessToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
  }
  
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }
  
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }
  
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.exp) {
        return Date.now() >= decoded.exp * 1000;
      }
      return false;
    } catch {
      return true;
    }
  }
  
  getUserFromToken(token: string): User | null {
    try {
      const decoded: any = jwtDecode(token);
      
      return {
        id: decoded.sub || decoded.id || '',
        name: decoded.name || '',
        email: decoded.email || '',
        role: decoded.role || ''
      };
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }
} 
