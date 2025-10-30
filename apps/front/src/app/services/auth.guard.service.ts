import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { ROUTES } from '../app.routes';
import { AuthService } from './auth.service';

/**
 * Сервис защитник роутов. Запрещает неавторизованному пользователя попадать
 * на защищенные роуты.
 * @implements {CanActivate}
 */
@Injectable({ providedIn: 'root' })
export class AuthGuardService implements CanActivate {
  protected readonly auth = inject(AuthService);
  protected readonly router = inject(Router);

  /**
   * Проверяет авторизацию пользоваетля. Если пользователь не авторизован, то перенаправляет на /login.
   * @param {ActivatedRouteSnapshot} route - Снепшот роута.
   * @returns {boolean} - Флаг - разрешен ли переход на роут.
   */
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const isLoggedIn = this.auth.isLoggedIn();
    const onlyWhenLoggedOut = route.data['onlyWhenLoggedOut'] === true;

    if (onlyWhenLoggedOut && isLoggedIn) {
      this.router.navigate(['/']);
      return false;
    }

    if (!onlyWhenLoggedOut && !isLoggedIn) {
      this.router.navigate([ROUTES.Login]);
      return false;
    }

    return true;
  }
}
