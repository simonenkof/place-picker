import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiLoader } from '@taiga-ui/core';
import { combineLatest, finalize, map } from 'rxjs';
import { ReservationCardComponent } from '../../components/reservation-card/reservation-card.component';
import { GroupedReservation } from '../../models/api/grouped-reservation';
import { ReservationWithDeskName } from '../../models/api/reservation-with-desk-name';
import { TimeSlot } from '../../models/time-slot';
import { DesksService } from '../../services/desks.service';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'pp-info',
  imports: [ReservationCardComponent, TuiLoader, TuiButton, RouterLink],
  templateUrl: './info.component.html',
  styleUrl: './info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoComponent implements OnInit {
  protected groupedReservations = signal<GroupedReservation[]>([]);
  protected isLoading = signal(false);

  protected readonly reservationService = inject(ReservationService);
  protected readonly desksService = inject(DesksService);

  ngOnInit() {
    this.loadUserReservations();
  }

  protected loadUserReservations() {
    this.isLoading.set(true);

    combineLatest([this.reservationService.getUserReservations(), this.desksService.getDesks()])
      .pipe(
        map(([reservations, desks]) => {
          // Добавляем deskName к каждому бронированию
          const reservationsWithDeskName: ReservationWithDeskName[] = reservations.map((reservation) => {
            const desk = desks.find((d) => d.id === reservation.deskId);
            return {
              ...reservation,
              deskName: desk?.name || `Стол #${reservation.deskId}`,
            };
          });

          // Группируем бронирования по deskId и дате
          const groupedMap = new Map<string, GroupedReservation>();

          reservationsWithDeskName.forEach((reservation) => {
            // Обрабатываем каждый временной слот
            reservation.reservedSlots.forEach((slot) => {
              // Получаем дату без времени для группировки
              const dateKey = this.getDateKey(slot.dateFrom);
              const groupKey = `${reservation.deskId}_${dateKey}`;

              let group = groupedMap.get(groupKey);

              if (!group) {
                group = {
                  deskId: reservation.deskId,
                  deskName: reservation.deskName,
                  reservationIds: [],
                  reservedSlots: [],
                  date: new Date(slot.dateFrom.getFullYear(), slot.dateFrom.getMonth(), slot.dateFrom.getDate()),
                };
                groupedMap.set(groupKey, group);
              }

              // Добавляем reservation ID, если его еще нет
              if (!group.reservationIds.includes(reservation.id)) {
                group.reservationIds.push(reservation.id);
              }

              // Добавляем временной слот, если его еще нет (проверяем по времени начала и окончания)
              const slotExists = group.reservedSlots.some(
                (existingSlot) =>
                  existingSlot.dateFrom.getTime() === slot.dateFrom.getTime() && existingSlot.dateTo.getTime() === slot.dateTo.getTime(),
              );

              if (!slotExists) {
                group.reservedSlots.push(new TimeSlot(slot.dateFrom.toISOString(), slot.dateTo.toISOString()));
              }
            });
          });

          // Сортируем слоты по времени начала
          const grouped = Array.from(groupedMap.values());
          grouped.forEach((group) => {
            group.reservedSlots.sort((a, b) => a.dateFrom.getTime() - b.dateFrom.getTime());
          });

          // Сортируем группы по дате
          grouped.sort((a, b) => a.date.getTime() - b.date.getTime());

          return grouped;
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((groupedReservations) => {
        this.groupedReservations.set(groupedReservations);
        this.isLoading.set(false);
      });
  }

  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
