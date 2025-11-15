import { Component, input } from '@angular/core';
import { Desk } from '../../models/api/desks';
import { DayPickerComponent } from './day-picker/day-picker.component';
import { HourPickerComponent } from './hour-picker/hour-picker.component';

export const ReservationTab = {
  Hour: 0,
  Day: 1,
} as const;

export type ReservationTab = (typeof ReservationTab)[keyof typeof ReservationTab];

@Component({
  selector: 'pp-reserve-picker',
  imports: [HourPickerComponent, DayPickerComponent],
  templateUrl: './reserve-picker.component.html',
  styleUrl: './reserve-picker.component.css',
})
export class ReservePickerComponent {
  activeTab = input.required<ReservationTab>();
  desk = input.required<Desk>();
  date = input.required<Date>();

  protected readonly reservationTab = ReservationTab;
}
