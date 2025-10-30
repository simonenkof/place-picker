import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiButton, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiButtonLoading, TuiPassword } from '@taiga-ui/kit';
import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { catchError, finalize } from 'rxjs';
import { ROUTES } from '../../app.routes';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'pp-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiButton,
    TuiTextfield,
    TuiIcon,
    TuiPassword,
    TuiButtonLoading,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected isPasswordVisible = false;
  protected isLoginSent = false;
  protected loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
  });

  protected readonly appRoutes = ROUTES;

  protected readonly alertService = inject(AlertService);
  protected readonly auth = inject(AuthService);
  protected readonly router = inject(Router);

  /**
   * Отправляет запрос на авторизацию. Если авторизация не прошла, то показывает сообщение
   * с ошибкой.
   */
  protected login(): void {
    const email = this.loginForm.get('email');
    const password = this.loginForm.get('password');

    if (email && password && this.loginForm.valid) {
      this.isLoginSent = true;

      this.auth
        .login({ email: email.getRawValue(), password: password.getRawValue() })
        .pipe(
          finalize(() => (this.isLoginSent = false)),
          catchError((err) => {
            password.reset();
            this.alertService.show('Введен неверный логин или пароль', 'negative', 'x');
            return err;
          }),
        )
        .subscribe(() => this.router.navigate([ROUTES.Reservations]));
    }
  }
}
