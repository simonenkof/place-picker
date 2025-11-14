import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TuiValidationError } from '@taiga-ui/cdk/classes';
import { TuiButton, TuiError, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiButtonLoading, TuiFieldErrorPipe, TuiPassword } from '@taiga-ui/kit';
import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { catchError, EMPTY, finalize, of } from 'rxjs';
import { ROUTES } from '../../app.routes';
import { AlertService } from '../../services/alert.service';
import { AuthService, RegisterPayload } from '../../services/auth.service';
import { BaseLoginComponent } from '../base-login/base-login.component';

type RegisterForm = {
  name: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
};

type Validation = {
  control: string;
  condition: (value: string) => boolean;
  errorMessage: string;
};

@Component({
  selector: 'pp-register',
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
    TuiError,
    TuiFieldErrorPipe,
    AsyncPipe,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  protected isPasswordVisible = false;
  protected isRegisterSent = false;
  protected registerForm = new FormGroup<RegisterForm>({
    name: new FormControl<string>('', { nonNullable: true }),
    email: new FormControl<string>('', { nonNullable: true }),
    password: new FormControl<string>('', { nonNullable: true }),
    confirmPassword: new FormControl<string>('', { nonNullable: true }),
  });

  protected readonly validations: Validation[] = [
    {
      control: 'name',
      condition: (value) => value.length >= 2 && value.length <= 20,
      errorMessage: 'Имя должно быть от 2 до 20 символов',
    },
    {
      control: 'email',
      condition: (value) => !Validators.email(new FormControl(value)),
      errorMessage: 'Неверный email адрес',
    },
    {
      control: 'password',
      condition: (value) => value.length >= 7 && value.length <= 20,
      errorMessage: 'Пароль должен быть от 7 до 20 символов',
    },
    {
      control: 'confirmPassword',
      condition: (value) => value === this.registerForm.get('password')?.value,
      errorMessage: 'Пароли не совпадают',
    },
  ];

  protected readonly appRoutes = ROUTES;

  protected readonly alertService = inject(AlertService);
  protected readonly auth = inject(AuthService);
  protected readonly router = inject(Router);

  ngOnInit(): void {
    this.initValidators();
  }

  protected register(): void {
    const payload: RegisterPayload = {
      name: this.registerForm.controls.name.getRawValue(),
      email: this.registerForm.controls.email.getRawValue(),
      password: this.registerForm.controls.password.getRawValue(),
    };

    this.auth
      .register(payload)
      .pipe(
        finalize(() => (this.isRegisterSent = false)),
        catchError(() => {
          this.alertService.show('Не удалось зарегистрироваться', 'negative', 'x');
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.alertService.show('На ваш email отправлено письмо для подтверждения регистрации');
        this.router.navigate([this.appRoutes.Login]);
      });
  }

  private initValidators(): void {
    this.validations.forEach(({ control, condition, errorMessage }) => {
      const foundControl = this.registerForm.get(control);

      if (foundControl) {
        foundControl.setAsyncValidators(this.createValidator((field) => condition(field.value), errorMessage));
      }
    });
  }

  /**
   * Возвращает асинхронный валидатор.
   * @param {(field: AbstractControl) => boolean} validatorFn - Функция валидатора.
   * @param {string} errMessage - Сообщение об ошибке.
   * @returns {AsyncValidatorFn} - Асинхронный валидатор.
   */
  private createValidator(validatorFn: (field: AbstractControl) => boolean, errMessage: string): AsyncValidatorFn {
    return (field: AbstractControl) =>
      validatorFn(field)
        ? of(null)
        : of({
            error: new TuiValidationError(errMessage),
          });
  }
}
