export enum UserRole {
  USER = 'USER',
  REVIEWER = 'REVIEWER'
}

export interface AuthResponse {
  access_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
} 