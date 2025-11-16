import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DaySlot } from '../day-picker.component';

@Component({
  selector: 'pp-day-picker-slot-item',
  imports: [CommonModule],
  templateUrl: './day-picker-slot-item.component.html',
  styleUrl: './day-picker-slot-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayPickerSlotItemComponent {
  slot = input.required<DaySlot>();
  selected = input<boolean>(false);

  slotSelected = output<DaySlot>();

  protected formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  protected formatDayOfWeek(date: Date): string {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  }

  protected onSlotClick(): void {
    if (this.slot().isAvailable) {
      this.slotSelected.emit(this.slot());
    }
  }
}
