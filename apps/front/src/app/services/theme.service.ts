import { Injectable, signal } from '@angular/core';
import { LOCAL_STORAGE_KEYS } from '../local-storage-keys';

export const AppTheme = {
  Dark: 'dark',
  Light: 'light',
} as const;
export type AppTheme = (typeof AppTheme)[keyof typeof AppTheme];

/**
 * Сервис переключения темы приложения. Для хранения темы использует
 * локальное хранилище.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly theme = signal<AppTheme>(AppTheme.Light);
  public readonly currentTheme = this.theme.asReadonly();

  /**
   * Инициализирует сервис и запускает инициализацию темы.
   */
  constructor() {
    this.initTheme();
  }

  /**
   * Изменяет тему приложения на переданную.
   * @param {AppTheme} theme - Новая тема приложения.
   */
  public changeTheme(theme: AppTheme): void {
    this.theme.set(theme);
    localStorage.setItem(LOCAL_STORAGE_KEYS.selectedTheme, theme);
  }

  /**
   * Инициализирует тему приложения из локального хранилища.
   */
  private initTheme(): void {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.selectedTheme) as AppTheme;
    this.theme.set(stored === AppTheme.Dark ? AppTheme.Dark : AppTheme.Light);
  }
}
