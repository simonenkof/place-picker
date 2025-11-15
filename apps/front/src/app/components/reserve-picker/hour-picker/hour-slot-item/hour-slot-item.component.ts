import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HourSlot } from '../hour-picker.component';

@Component({
  selector: 'pp-hour-slot-item',
  imports: [CommonModule],
  templateUrl: './hour-slot-item.component.html',
  styleUrl: './hour-slot-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HourSlotItemComponent {
  slot = input.required<HourSlot>();
  selected = input<boolean>(false);

  slotSelected = output<HourSlot>();

  formatTime(date: Date): string {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  onSlotClick(): void {
    if (this.slot().isAvailable) {
      this.slotSelected.emit(this.slot());
    }
  }
}
