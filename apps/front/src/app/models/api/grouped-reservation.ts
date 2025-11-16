import { TimeSlot } from '../time-slot';

export interface GroupedReservation {
  deskId: string;
  deskName: string;
  reservationIds: string[];
  reservedSlots: TimeSlot[];
  date: Date; // Дата для группировки (только день, месяц, год)
}

