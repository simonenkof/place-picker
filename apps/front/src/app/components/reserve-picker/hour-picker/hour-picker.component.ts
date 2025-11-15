import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { Desk, TimeSlot } from '../../../models/api/desks';
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
  desk = input.required<Desk>();
  date = input.required<Date>();

  selectedSlots = signal<Set<number>>(new Set());

  private slotsForReserve: HourSlot[] = [];

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

  private isSlotAvailable(from: Date, to: Date, reservedSlots: TimeSlot[]): boolean {
    return !reservedSlots.some((slot) => {
      const slotFrom = new Date(slot.dateFrom);
      const slotTo = new Date(slot.dateTo);

      return from < slotTo && to > slotFrom;
    });
  }
}
