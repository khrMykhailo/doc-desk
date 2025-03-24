import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../auth/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../auth/models/auth.models';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', [
      'logout',
      'isAuthenticated',
      'currentUser'
    ]);
    
    authService.isAuthenticated.and.returnValue(true);
    const mockUser: User = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN'
    };
    authService.currentUser.and.returnValue(mockUser);

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        RouterTestingModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule
      ],
      providers: [
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default user values', () => {
    expect(component.defaultUser).toBeDefined();
    expect(component.defaultUser.name).toBe('Guest');
    expect(component.defaultUser.role).toBe('Visitor');
  });

  it('should call authService.logout when onLogout is called', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.onLogout();
    
    expect(authService.logout).toHaveBeenCalled();
  });
}); 