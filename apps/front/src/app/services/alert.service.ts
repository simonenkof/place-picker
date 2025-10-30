import { inject, Injectable } from '@angular/core';
import { TuiAlertService } from '@taiga-ui/core';
import { take } from 'rxjs';

export type AlertType = 'info' | 'negative';

/**
 * Сервис для отображения алертов. Является оберткой над TuiAlertService для упрощения
 * вызова алертов.
 */
@Injectable({
  providedIn: 'root',
})
export class AlertService {
  protected readonly alerts = inject(TuiAlertService);

  /**
   * Отображает алерт с переданными параметрами.
   * @param {string} message - Сообщения алерта.
   * @param {AlertType} type - Тип алерта (info или negative). Необязательный пареметр.
   * @param {string} icon - Иконка алерата. Необязательный параметр.
   */
  public show(message: string, type: AlertType = 'info', icon = ''): void {
    this.alerts
      .open('', { label: message, appearance: type, ...(icon !== '' && { icon: icon }) })
      .pipe(take(1))
      .subscribe();
  }
}
