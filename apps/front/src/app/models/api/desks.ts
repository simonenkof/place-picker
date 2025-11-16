import { TimeSlot } from '../time-slot';

export class Desk {
  id = '';
  name = '';
  reserved = false;
  createdAt = '';
  updatedAt = '';
  reservedSlots: TimeSlot[] = [];

  constructor(data: Partial<Desk>) {
    Object.assign(this, data);
  }
}
