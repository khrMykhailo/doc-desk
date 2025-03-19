import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Використовуємо Auth сервіс для отримання даних користувача
  protected readonly authService = inject(AuthService);
  
  // Мок-дані, які будуть показані, якщо користувач не авторизований
  readonly defaultUser = {
    name: 'Guest',
    role: 'Visitor'
  };

  onLogout() {
    this.authService.logout();
  }
} 