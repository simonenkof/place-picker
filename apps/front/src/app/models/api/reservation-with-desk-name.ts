import { Reservation } from './reservation';

export interface ReservationWithDeskName extends Reservation {
  deskName: string;
}

