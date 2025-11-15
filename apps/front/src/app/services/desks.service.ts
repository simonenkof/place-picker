import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ApiEndpoint } from '../app.routes';
import { Desk, TimeSlot } from '../models/api/desks';
import { HttpService } from './http.service';

interface DeskResponse {
  desks: {
    id: string;
    name: string;
    reserved: boolean;
    createdAt: string;
    updatedAt: string;
    reservedSlots: { dateFrom: string; dateTo: string }[];
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class DesksService {
  private desks = new BehaviorSubject<Desk[]>([]);

  protected readonly http = inject(HttpService);

  constructor() {
    this.updateDesks();
  }

  public getDesks(): Observable<Desk[]> {
    return this.desks.asObservable();
  }

  public getDeskById(id: string): Observable<Desk | undefined> {
    return this.desks.asObservable().pipe(map((desks) => desks.find((desk) => desk.id === id)));
  }

  private updateDesks(): void {
    this.http
      .get<DeskResponse>(ApiEndpoint.Desks)
      .pipe(
        map((response) =>
          response.desks.map(
            (desk) =>
              new Desk({
                id: desk.id,
                name: desk.name,
                reserved: desk.reserved,
                createdAt: desk.createdAt,
                updatedAt: desk.updatedAt,
                reservedSlots: desk.reservedSlots.map((slot) => new TimeSlot(slot.dateFrom, slot.dateTo)),
              }),
          ),
        ),
      )
      .subscribe((desks) => {
        this.desks.next(desks);
      });
  }
}
