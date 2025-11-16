import { TimeSlot } from '../time-slot';

export class Reservation {
  id = '';
  deskId = '';
  reservedSlots: TimeSlot[] = [];

  constructor(data: Partial<Reservation>) {
    Object.assign(this, data);
  }
}
