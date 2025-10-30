import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';

/**
 * Сервис обертка над HttpClient. Хранит базовый URL для обращения к серверу.
 * Добавляет к запросам хедер с авторизацией.
 */
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  protected baseUrl: string;
  protected readonly http = inject(HttpClient);
  protected readonly roture = inject(Router);

  constructor() {
    this.baseUrl = environment.apiUrl;
  }

  /**
   * Создает заголовки для запроса.
   * @param {boolean} addAuth - Флаг добавления авторизации. Необязательный параметр.
   * @returns {HttpHeaders} - Заголовки запроса.
   */
  private createHeaders(addAuth = true): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (addAuth) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Обертка над GET запросом. Добавляет к запросу хедеры.
   * @param {string} path - Адрес конечной точки.
   * @param {boolean} addAuth - Флаг добавления авторизации. Необязательный параметр.
   * @returns {Observable<T>} - Обернутый http запрос.
   */
  get<T>(path: string, addAuth = true): Observable<T> {
    return this.http.get<T>(this.baseUrl + path, {
      headers: this.createHeaders(addAuth),
    });
  }

  /**
   * Обертка над POST запросом. Добавляет к запросу хедеры и тело.
   * @param {string} path - Адрес конечной точки.
   * @param {N} body - Тело запроса.
   * @param {boolean} addAuth - Флаг добавления авторизации. Необязательный параметр.
   * @returns {Observable<T>} - Обернутый http запрос.
   */
  post<T, N>(path: string, body: N, addAuth = true): Observable<T> {
    return this.http.post<T>(this.baseUrl + path, body, {
      headers: this.createHeaders(addAuth),
    });
  }

  /**
   * Обертка над PUT запросом. Добавляет к запросу хедеры и тело.
   * @param {string} path - Адрес конечной точки.
   * @param {N} body - Тело запроса.
   * @param {boolean} addAuth - Флаг добавления авторизации. Необязательный параметр.
   * @returns {Observable<T>} - Обернутый http запрос.
   */
  put<T>(path: string, body: unknown, addAuth = true): Observable<T> {
    return this.http.put<T>(this.baseUrl + path, body, {
      headers: this.createHeaders(addAuth),
    });
  }

  /**
   * Обертка над DELETE запросом. Добавляет к запросу хедеры и тело.
   * @param {string} path - Адрес конечной точки.
   * @param {boolean} addAuth - Флаг добавления авторизации. Необязательный параметр.
   * @returns {Observable<T>} - Обернутый http запрос.
   */
  delete<T>(path: string, addAuth = true): Observable<T> {
    return this.http.delete<T>(this.baseUrl + path, {
      headers: this.createHeaders(addAuth),
    });
  }
}
