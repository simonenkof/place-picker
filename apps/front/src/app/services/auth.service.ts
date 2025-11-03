import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, tap } from 'rxjs';
import { ApiEndpoint, ROUTES } from '../app.routes';
import { accessTokenKey, refreshTokenKey } from '../localstorage-keys';
import { AlertService } from './alert.service';
import { HttpService } from './http.service';

export const TokenType = {
  Access: 'access',
  Refresh: 'refresh',
} as const;
export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type UserCreds = {
  email: string;
  password: string;
};

export type LoginPayload = UserCreds;

export type RegisterPayload = LoginPayload & {
  name: string;
};

/**
 * Сервис авторизации. Позволяет получить токены доступа, обновить их и выйти из профиля.
 * Хранит токены в локальном хранилище, что не безопасно. Лучше переместить хранение на сервер
 * и передавать токены через куки.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  protected readonly http = inject(HttpService);
  protected readonly router = inject(Router);
  protected readonly alert = inject(AlertService);

  /**
   * Отправляет запрос для авторизации пользователя. При удачном запросе
   * сохраняет токены в локальное хранилище.
   * @param {UserCreds} creds - Данные пользователя.
   * @returns {Observable<TokenResponse>} - Поток данных с настроенным запросом.
   */
  public login(creds: UserCreds): Observable<TokenResponse> {
    const payload: LoginPayload = { email: creds.email, password: creds.password };

    return this.http.post<TokenResponse, LoginPayload>(ApiEndpoint.Login, payload, false).pipe(
      tap((response) => {
        localStorage.setItem(accessTokenKey, response.accessToken);
        localStorage.setItem(refreshTokenKey, response.refreshToken);
      }),
    );
  }

  public register(creds: RegisterPayload) {
    return this.http.post<object, RegisterPayload>(ApiEndpoint.Register, creds);
  }

  /**
   * Отправлет запрос для обновления токенов пользователя. В случае, если
   * рефреш токена нет или токен просрочен, то показывает соответствующее уведомление.
   * При удачном запросе сохраняет токены в локальное хранилище.
   * @returns {Observable<TokenResponse>} - Поток данных с настроенным запросом на обновление токенов.
   */
  public refresh(): Observable<TokenResponse> {
    const refreshToken = localStorage.getItem(refreshTokenKey);

    if (!refreshToken || this.isTokenExpired(refreshToken)) {
      this.logout();
      this.router.navigate([ROUTES.Login]);
      this.alert.show('Истек срок действия доступа', 'negative');
      return EMPTY;
    }

    return this.http.post<TokenResponse, Pick<TokenResponse, 'refreshToken'>>(ApiEndpoint.Refresh, { refreshToken }, false).pipe(
      tap((tokens) => {
        localStorage.setItem(accessTokenKey, tokens.accessToken);
        localStorage.setItem(refreshTokenKey, tokens.refreshToken);
      }),
    );
  }

  /**
   * Удаляет токеы из локального хранилища.
   */
  public logout(): void {
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
  }

  /**
   * Возвращает авторизован ли пользователь.
   * @returns {boolean} - Флаг - авторизован ли пользователь.
   */
  public isLoggedIn(): boolean {
    return !!this.getToken(TokenType.Access);
  }

  /**
   * Обращается в хранилище и возвращает нужный токен.
   * @param {TokenType} type - Тип токена.
   * @returns {string | null} - Нужный токен, либо null, если нет сохраненного токена.
   */
  private getToken(type: TokenType): string | null {
    return type === TokenType.Access ? localStorage.getItem(accessTokenKey) : localStorage.getItem(refreshTokenKey);
  }

  /**
   * Проверяет просрочен ли токен.
   * @param {string} token - jwt токен.
   * @returns {boolean} - true - просрочен, иначе false.
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      return !exp || Date.now() >= exp * 1000;
    } catch (e) {
      console.error('Invalid refresh token', e);
      return true;
    }
  }
}
