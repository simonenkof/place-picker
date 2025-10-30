import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ROUTES } from '../../app.routes';
import { AlertService } from '../../services/alert.service';
import { AuthService, TokenResponse } from '../../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;
  let alertService: jest.Mocked<AlertService>;

  const mockTokenResponse: TokenResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const authServiceMock = {
      login: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const routerMock = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    const alertServiceMock = {
      show: jest.fn().mockReturnValue(of(void 0)),
    } as unknown as jest.Mocked<AlertService>;

    const activatedRouteMock = {} as unknown as jest.Mocked<ActivatedRoute>;

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AlertService, useValue: alertServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
    alertService = TestBed.inject(AlertService) as jest.Mocked<AlertService>;
    fixture.detectChanges();
  });

  describe('Инициализация', () => {
    it('Должен создать компонент', () => {
      expect(component).toBeTruthy();
    });

    it('Должен инициализировать форму с пустыми значениями', () => {
      expect(component['loginForm'].get('email')?.value).toBe('');
      expect(component['loginForm'].get('password')?.value).toBe('');
    });
  });

  describe('Валидация формы', () => {
    it('Форма должна быть невалидной при пустых полях', () => {
      expect(component['loginForm'].valid).toBeFalsy();
    });

    it('Поле пароля должно быть невалидным при длине менее 2 символов', () => {
      const passwordControl = component['loginForm'].get('password') as FormControl;
      passwordControl.setValue('a');
      expect(passwordControl.valid).toBeFalsy();
    });

    it('Поле пароля должно быть невалидным при длине более 20 символов', () => {
      const passwordControl = component['loginForm'].get('password') as FormControl;
      passwordControl.setValue('a'.repeat(21));
      expect(passwordControl.valid).toBeFalsy();
    });

    it('Форма должна быть валидной при корректных данных', () => {
      component['loginForm'].setValue({
        email: 'testuser@example.com',
        password: 'password123',
      });
      expect(component['loginForm'].valid).toBeTruthy();
    });
  });

  describe('Авторизация', () => {
    beforeEach(() => {
      component['loginForm'].setValue({
        email: 'testuser@example.com',
        password: 'password123',
      });
    });

    it('Должен вызывать AuthService.login с правильными параметрами', () => {
      authService.login.mockReturnValue(of(mockTokenResponse));
      component['login']();
      expect(authService.login).toHaveBeenCalledWith({
        email: 'testuser@example.com',
        password: 'password123',
      });
    });

    it('Должен перенаправлять на страницу бронирования после успешной авторизации', () => {
      authService.login.mockReturnValue(of(mockTokenResponse));
      component['login']();
      expect(router.navigate).toHaveBeenCalledWith([ROUTES.Reservations]);
    });

    it('Должен показывать ошибку при неудачной авторизации', () => {
      authService.login.mockReturnValue(throwError(() => new Error()));
      component['login']();
      expect(alertService.show).toHaveBeenCalledWith('Введен неверный логин или пароль', 'negative', 'x');
    });
  });
});
