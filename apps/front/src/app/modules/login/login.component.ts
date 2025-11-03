import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiButtonLoading, TuiPassword } from '@taiga-ui/kit';
import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { catchError, EMPTY, finalize } from 'rxjs';
import { ROUTES } from '../../app.routes';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { BaseLoginComponent } from '../base-login/base-login.component';

type LoginForm = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'stol-login',
  imports: [
    ReactiveFormsModule,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiButton,
    TuiTextfield,
    TuiIcon,
    TuiPassword,
    TuiButtonLoading,
    BaseLoginComponent,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected isPasswordVisible = false;
  protected isLoginSent = false;
  protected loginForm = new FormGroup<LoginForm>({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1), Validators.maxLength(20)],
    }),
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
    if (this.loginForm.valid) {
      this.isLoginSent = true;

      this.auth
        .login({ email: this.loginForm.controls.email.getRawValue(), password: this.loginForm.controls.password.getRawValue() })
        .pipe(
          finalize(() => (this.isLoginSent = false)),
          catchError(() => {
            this.loginForm.controls.password.reset();
            this.alertService.show('Введен неверный логин или пароль', 'negative', 'x');
            return EMPTY;
          }),
        )
        .subscribe(() => this.router.navigate([ROUTES.Reservations]));
    }
  }
}
