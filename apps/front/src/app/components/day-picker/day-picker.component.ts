import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { TuiButton, TuiScrollbar } from '@taiga-ui/core';
import { forkJoin } from 'rxjs';
import { Desk, TimeSlot } from '../../models/api/desks';
import { AlertService } from '../../services/alert.service';
import { DesksService } from '../../services/desks.service';
import { ReservationService } from '../../services/reservation.service';
import { DayPickerSlotItemComponent } from './day-picker-slot-item/day-picker-slot-item.component';

export interface DaySlot {
  from: Date;
  to: Date;
  isAvailable: boolean;
}

@Component({
  selector: 'pp-day-picker',
  imports: [CommonModule, DayPickerSlotItemComponent, TuiButton, TuiScrollbar],
  templateUrl: './day-picker.component.html',
  styleUrl: './day-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayPickerComponent {
  public desk = input.required<Desk>();
  public date = input.required<Date>();

  protected slotsForReserve: DaySlot[] = [];
  private selectedSlots = signal<Set<number>>(new Set());

  private readonly reservationService = inject(ReservationService);
  private readonly alertService = inject(AlertService);
  private readonly desksService = inject(DesksService);

  protected readonly daySlots = computed<DaySlot[]>(() => {
    const desk = this.desk();
    const date = this.date();
    const slots: DaySlot[] = [];

    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const from = new Date(year, month, day, 5, 0, 0, 0);
      const to = new Date(year, month, day, 18, 0, 0, 0);

      const isAvailable = this.isSlotAvailable(from, to, desk.reservedSlots);

      slots.push({ from, to, isAvailable });
    }

    return slots;
  });

  protected isSlotSelected = (slot: DaySlot): boolean => {
    return this.selectedSlots().has(slot.from.getTime());
  };

  protected onSlotSelected = (slot: DaySlot): void => {
    const currentSelected = this.selectedSlots();
    const newSelected = new Set(currentSelected);

    if (newSelected.has(slot.from.getTime())) {
      newSelected.delete(slot.from.getTime());
    } else {
      newSelected.add(slot.from.getTime());
    }

    this.selectedSlots.set(newSelected);
    this.slotsForReserve = this.daySlots().filter((s) => newSelected.has(s.from.getTime()));
  };

  protected onReserveClick(): void {
    if (this.slotsForReserve.length === 0) {
      return;
    }

    const sortedSlots = [...this.slotsForReserve].sort((a, b) => a.from.getTime() - b.from.getTime());

    const groupedIntervals: DaySlot[][] = [];
    let currentGroup: DaySlot[] = [sortedSlots[0]];

    for (let i = 1; i < sortedSlots.length; i++) {
      const prevSlot = sortedSlots[i - 1];
      const currentSlot = sortedSlots[i];

      const prevDay = new Date(prevSlot.from);
      prevDay.setHours(0, 0, 0, 0);
      const nextDay = new Date(prevDay);
      nextDay.setDate(nextDay.getDate() + 1);

      const currentDay = new Date(currentSlot.from);
      currentDay.setHours(0, 0, 0, 0);

      if (currentDay.getTime() === nextDay.getTime()) {
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
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
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
