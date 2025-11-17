import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiEndpoint } from '../app.routes';
import { User } from '../models/api/user';
import { HttpService } from './http.service';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private user = new BehaviorSubject<User | null>(null);

  private readonly http = inject(HttpService);

  constructor() {
    this.updateUser();
  }

  public getUser(): Observable<User | null> {
    return this.user.asObservable();
  }

  private updateUser() {
    this.http.get<UserResponse>(ApiEndpoint.Me).subscribe((res) => {
      const user = new User({
        id: res.id,
        email: res.email,
        name: res.name,
        passwordHash: res.passwordHash,
        role: res.role,
        createdAt: new Date(res.createdAt),
        updatedAt: new Date(res.updatedAt),
      });

      this.user.next(user);
    });
  }
}
