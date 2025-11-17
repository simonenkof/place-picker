import { Component, computed, input } from '@angular/core';
import { Desk } from '../../models/api/desks';
import { TimeSlot } from '../../models/time-slot';

type DeskStatus = 'reserved-by-me' | 'fully-reserved' | 'partially-reserved' | 'available';

@Component({
  selector: 'pp-table',
  imports: [],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent {
  public desk = input.required<Desk>();
  public reserved = input<boolean | null>(null);

  protected readonly deskStatus = computed<DeskStatus>(() => {
    const desk = this.desk();

    if (desk.reservedByMe) {
      return 'reserved-by-me';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todaySlots = desk.reservedSlots.filter((slot) => {
      const slotFrom = new Date(slot.dateFrom);
      const slotTo = new Date(slot.dateTo);
      return slotTo >= today && slotFrom <= todayEnd;
    });

    if (todaySlots.length === 0) {
      return 'available';
    }

    const workDayStart = new Date(today);
    workDayStart.setHours(8, 0, 0, 0);
    const workDayEnd = new Date(today);
    workDayEnd.setHours(21, 0, 0, 0);

    const isFullyReserved = this.isDayFullyReserved(workDayStart, workDayEnd, todaySlots);

    return isFullyReserved ? 'fully-reserved' : 'partially-reserved';
  });

  private isDayFullyReserved(dayStart: Date, dayEnd: Date, reservedSlots: TimeSlot[]): boolean {
    if (reservedSlots.length === 0) {
      return false;
    }

    const mergedSlots = this.mergeOverlappingSlots(reservedSlots);

    const sortedSlots = mergedSlots.sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());

    let currentTime = dayStart.getTime();
    const endTime = dayEnd.getTime();

    for (const slot of sortedSlots) {
      const slotFrom = new Date(slot.dateFrom).getTime();
      const slotTo = new Date(slot.dateTo).getTime();

      const normalizedFrom = Math.max(slotFrom, dayStart.getTime());
      const normalizedTo = Math.min(slotTo, dayEnd.getTime());

      if (normalizedFrom > currentTime) {
        return false;
      }

      currentTime = Math.max(currentTime, normalizedTo);

      if (currentTime >= endTime) {
        return true;
      }
    }

    return currentTime >= endTime;
  }

  private mergeOverlappingSlots(slots: TimeSlot[]): TimeSlot[] {
    if (slots.length === 0) {
      return [];
    }

    const sorted = [...slots].sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());

    const merged: TimeSlot[] = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const currentEnd = new Date(current.dateTo).getTime();
      const nextStart = new Date(next.dateFrom).getTime();

      if (nextStart <= currentEnd) {
        const mergedEnd = Math.max(currentEnd, new Date(next.dateTo).getTime());
        current = new TimeSlot(current.dateFrom.toISOString(), new Date(mergedEnd).toISOString());
      } else {
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    return merged;
  }
}
