import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoint } from '../app.routes';
import { HttpService } from './http.service';

export interface ReserveDeskRequest {
  deskId: string;
  dateFrom: string;
  dateTo: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private readonly http = inject(HttpService);

  public reserveDesk(request: ReserveDeskRequest): Observable<void> {
    return this.http.post<void, ReserveDeskRequest>(ApiEndpoint.Reservation, request);
  }
}
