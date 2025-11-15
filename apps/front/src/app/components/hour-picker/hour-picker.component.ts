import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { forkJoin } from 'rxjs';
import { Desk, TimeSlot } from '../../models/api/desks';
import { AlertService } from '../../services/alert.service';
import { DesksService } from '../../services/desks.service';
import { ReservationService } from '../../services/reservation.service';
import { HourSlotItemComponent } from './hour-slot-item/hour-slot-item.component';

export interface HourSlot {
  from: Date;
  to: Date;
  isAvailable: boolean;
}

@Component({
  selector: 'pp-hour-picker',
  imports: [CommonModule, HourSlotItemComponent, TuiButton],
  templateUrl: './hour-picker.component.html',
  styleUrl: './hour-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HourPickerComponent {
  public desk = input.required<Desk>();
  public date = input.required<Date>();

  protected slotsForReserve: HourSlot[] = [];
  private selectedSlots = signal<Set<number>>(new Set());

  private readonly reservationService = inject(ReservationService);
  private readonly alertService = inject(AlertService);
  private readonly desksService = inject(DesksService);

  protected readonly hourSlots = computed<HourSlot[]>(() => {
    const desk = this.desk();
    const slots: HourSlot[] = [];

    for (let hour = 8; hour < 21; hour++) {
      const from = new Date(this.date());
      from.setHours(hour, 0, 0, 0);

      const to = new Date(this.date());
      to.setHours(hour + 1, 0, 0, 0);

      const isAvailable = this.isSlotAvailable(from, to, desk.reservedSlots);

      slots.push({ from, to, isAvailable });
    }

    return slots;
  });

  protected isSlotSelected = (slot: HourSlot): boolean => {
    return this.selectedSlots().has(slot.from.getTime());
  };

  protected onSlotSelected = (slot: HourSlot): void => {
    const currentSelected = this.selectedSlots();
    const newSelected = new Set(currentSelected);

    if (newSelected.has(slot.from.getTime())) {
      newSelected.delete(slot.from.getTime());
    } else {
      newSelected.add(slot.from.getTime());
    }

    this.selectedSlots.set(newSelected);
    this.slotsForReserve = this.hourSlots().filter((s) => newSelected.has(s.from.getTime()));
  };

  protected onReserveClick(): void {
    if (this.slotsForReserve.length === 0) {
      return;
    }

    const sortedSlots = [...this.slotsForReserve].sort((a, b) => a.from.getTime() - b.from.getTime());

    const groupedIntervals: HourSlot[][] = [];
    let currentGroup: HourSlot[] = [sortedSlots[0]];

    for (let i = 1; i < sortedSlots.length; i++) {
      const prevSlot = sortedSlots[i - 1];
      const currentSlot = sortedSlots[i];

      if (currentSlot.from.getTime() === prevSlot.to.getTime()) {
        currentGroup.push(currentSlot);
      } else {
        groupedIntervals.push(currentGroup);
        currentGroup = [currentSlot];
      }
    }

    groupedIntervals.push(currentGroup);

    const requests = groupedIntervals.map((group) => {
      const firstSlot = group[0];
      const lastSlot = group[group.length - 1];

      return this.reservationService.reserveDesk({
        deskId: this.desk().id,
        dateFrom: this.formatDate(firstSlot.from),
        dateTo: this.formatDate(lastSlot.to),
      });
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.selectedSlots.set(new Set());
        this.slotsForReserve = [];
        this.alertService.show('Бронирование успешно', 'info');
        this.desksService.updateDesks();
      },
      error: () => {
        this.alertService.show('Не удалось забронировать', 'negative');
      },
    });
  }

  private formatDate(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${hours}:${minutes} ${day}.${month}.${year}`;
  }

  private isSlotAvailable(from: Date, to: Date, reservedSlots: TimeSlot[]): boolean {
    return !reservedSlots.some((slot) => {
      const slotFrom = new Date(slot.dateFrom);
      const slotTo = new Date(slot.dateTo);

      return from < slotTo && to > slotFrom;
    });
  }
}
