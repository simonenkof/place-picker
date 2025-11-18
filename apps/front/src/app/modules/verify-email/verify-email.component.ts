import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { ROUTES } from '../../app.routes';
import { AlertService } from '../../services/alert.service';
import { BaseLoginComponent } from '../base-login/base-login.component';

@Component({
  selector: 'pp-verify-email',
  imports: [BaseLoginComponent, TuiButton, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  protected isVerified = false;
  protected errorMessage = '';

  protected readonly appRoutes = ROUTES;

  protected readonly alertService = inject(AlertService);
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const error = this.route.snapshot.queryParams['error'];
    const token = this.route.snapshot.queryParams['token'];

    if (error) {
      switch (error) {
        case 'invalid_or_expired_token':
          this.errorMessage = 'Неверный или истекший токен';
          break;
        case 'failed_to_verify':
          this.errorMessage = 'Не удалось подтвердить email';
          break;
        default:
          this.errorMessage = 'Произошла ошибка при подтверждении email';
      }
      this.alertService.show(this.errorMessage, 'negative');
    } else if (token) {
      this.isVerified = true;
    } else {
      this.errorMessage = 'Токен не найден';
      this.alertService.show(this.errorMessage, 'negative');
    }
  }
}
