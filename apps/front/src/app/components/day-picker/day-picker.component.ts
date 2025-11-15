import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Desk } from '../../models/api/desks';

@Component({
  selector: 'pp-day-picker',
  imports: [CommonModule],
  templateUrl: './day-picker.component.html',
  styleUrl: './day-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayPickerComponent {
  desk = input.required<Desk>();
  date = input.required<Date>();
}
