import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TuiAppearance, TuiButton, TuiDialogService } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiConfirmData } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { EMPTY, forkJoin, switchMap } from 'rxjs';
import { GroupedReservation } from '../../models/api/grouped-reservation';
import { AlertService } from '../../services/alert.service';
import { DesksService } from '../../services/desks.service';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'pp-reservation-card',
  imports: [TuiCardLarge, TuiAppearance, TuiButton],
  templateUrl: './reservation-card.component.html',
  styleUrl: './reservation-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationCardComponent {
  groupedReservation = input.required<GroupedReservation>();

  reservationDeleted = output<void>();

  protected readonly dialog = inject(TuiDialogService);
  protected readonly reservationService = inject(ReservationService);
  protected readonly desksService = inject(DesksService);
  protected readonly alertService = inject(AlertService);

  protected formatDate(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}.${month}.${year}`;
  }

  protected formatDateOnly(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  protected formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  protected formatDayOfWeek(date: Date): string {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  }

  protected getDuration(from: Date, to: Date): string {
    const diffMs = to.getTime() - from.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours} ч ${diffMinutes > 0 ? diffMinutes + ' мин' : ''}`;
    }
    return `${diffMinutes} мин`;
  }

  protected showCancelReservationDialog() {
    const reservationCount = this.groupedReservation().reservationIds.length;
    const content =
      reservationCount > 1
        ? `Вы уверены, что хотите отменить все бронирования (${reservationCount}) для этого стола на эту дату?`
        : 'Вы уверены, что хотите отменить бронирование?';

    const data: TuiConfirmData = {
      content,
      yes: 'Отменить',
      no: 'Оставить',
    };

    this.dialog
      .open<boolean>(TUI_CONFIRM, {
        label: 'Отмена бронирования',
        size: 'm',
        data,
      })
      .pipe(
        switchMap((response) => {
          response && this.cancelReservations();
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private cancelReservations() {
    const reservationIds = this.groupedReservation().reservationIds;

    // Отменяем все бронирования в группе
    const cancelRequests = reservationIds.map((id) => this.reservationService.cancelReservation(id));

    forkJoin(cancelRequests).subscribe({
      next: () => {
        const message =
          reservationIds.length > 1 ? `Все бронирования (${reservationIds.length}) успешно отменены` : 'Бронирование успешно отменено';
        this.alertService.show(message, 'info');
        this.desksService.updateDesks();
        this.reservationDeleted.emit();
      },
      error: () => {
        this.alertService.show('Не удалось отменить бронирование', 'negative', 'x');
      },
    });
  }
}
