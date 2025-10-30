import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { ApiEndpoint } from '../app.routes';
import { accessTokenKey } from '../localstorage-keys';
import { AuthService } from './auth.service';

/**
 * Перехватчик http запрсов. При получении ошибки авторизации пытается обновить токен доступа и отправить
 * повторный запрос.
 * @implements {HttpInterceptor}
 */
@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  /**
   * Перехватывает http запрос с ошибкой. Если ошибка является ошибкой авторизации, то
   * пробует обновить токены и сделать повторный запрос.
   * @param {HttpRequest<unknown>} req - Объект запроса.
   * @param {HttpHandler} next - Обработчик запросов.
   * @returns {Observable<HttpEvent<unknown>>} - Поток данных, обработанный HttpHandler.
   */
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && req.url.includes(ApiEndpoint.Login)) {
          return throwError(() => err);
        }

        if (err.status === 401 && !req.url.includes(ApiEndpoint.Refresh)) {
          return this.authService.refresh().pipe(
            switchMap(() => {
              const newAccessToken = localStorage.getItem(accessTokenKey);
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newAccessToken}` },
              });
              return next.handle(retryReq);
            }),
          );
        }

        return throwError(() => err);
      }),
    );
  }
}
