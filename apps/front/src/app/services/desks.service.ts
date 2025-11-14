import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoint } from '../app.routes';
import { Desk } from '../models/api/desks';
import { HttpService } from './http.service';

interface DeskResponse {
  desks: {
    id: string;
    name: string;
    reserved: boolean;
    createdAt: string;
    updatedAt: string;
    reservedSlots: string[];
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class DesksService {
  protected readonly http = inject(HttpService);

  public getDesks(): Observable<Desk[]> {
    return this.http.get<DeskResponse>(ApiEndpoint.Desks).pipe(map((response) => response.desks.map((desk) => new Desk(desk))));
  }
}
