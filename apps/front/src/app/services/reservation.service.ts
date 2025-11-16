import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
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
  private reservations = new BehaviorSubject<Reservation[]>([]);

  private readonly http = inject(HttpService);

  public getAllReservations(): Observable<Reservation[]> {
    return this.reservations.asObservable();
  }

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
      tap((reservations) => this.reservations.next(reservations)),
    );
  }

  public cancelReservation(reservationId: string): Observable<void> {
    return this.http.delete<void>(`${ApiEndpoint.Reservation}/${reservationId}`);
  }
}
