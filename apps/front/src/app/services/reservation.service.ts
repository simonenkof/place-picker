import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoint } from '../app.routes';
import { Reservation } from '../models/api/reservation';
import { TimeSlot } from '../models/time-slot';
import { HttpService } from './http.service';

export interface ReserveDeskRequest {
  deskId: string;
  dateFrom: string;
  dateTo: string;
}

export interface UserReservationsResponse {
  reservations: UserReservation[] | null;
}

interface UserReservation {
  reservationId: string;
  tableId: string;
  reservedSlots: { dateFrom: string; dateTo: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private readonly http = inject(HttpService);

  public reserveDesk(request: ReserveDeskRequest): Observable<void> {
    return this.http.post<void, ReserveDeskRequest>(ApiEndpoint.Reservation, request);
  }

  public getUserReservations(): Observable<Reservation[]> {
    return this.http.get<UserReservationsResponse>(ApiEndpoint.Reservation).pipe(
      map(
        (response) =>
          response.reservations?.map(
            (reservation) =>
              new Reservation({
                id: reservation.reservationId,
                deskId: reservation.tableId,
                reservedSlots: reservation.reservedSlots.map((slot) => new TimeSlot(slot.dateFrom, slot.dateTo)),
              }),
          ) ?? [],
      ),
    );
  }

  public cancelReservation(reservationId: string): Observable<void> {
    return this.http.delete<void>(`${ApiEndpoint.Reservation}/${reservationId}`);
  }
}
