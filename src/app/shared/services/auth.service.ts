import { Injectable, signal } from '@angular/core';

export enum UserRole {
  USER = 'USER',
  REVIEWER = 'REVIEWER'
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ROLE_KEY = 'role';
  
  public currentRole = signal<UserRole>(this.getUserRole());
  
  constructor() { }
  
  getUserRole(): UserRole {
    const role = localStorage.getItem(this.ROLE_KEY);
    return (role === UserRole.REVIEWER) ? UserRole.REVIEWER : UserRole.USER;
  }
  
  setUserRole(role: UserRole): void {
    localStorage.setItem(this.ROLE_KEY, role);
    this.currentRole.set(role);
  }
  
  isReviewer(): boolean {
    return this.getUserRole() === UserRole.REVIEWER;
  }
  
  isUser(): boolean {
    return this.getUserRole() === UserRole.USER;
  }
} 