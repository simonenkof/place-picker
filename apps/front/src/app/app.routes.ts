import { Routes } from '@angular/router';
import { InfoComponent } from './modules/info/info.component';
import { LoginComponent } from './modules/login/login.component';
import { MainComponent } from './modules/main/main.component';
import { RegisterComponent } from './modules/register/register.component';
import { ReservationsComponent } from './modules/reservations/reservations.component';
import { AuthGuardService } from './services/auth.guard.service';

export const ApiEndpoint = {
  Login: '/api/auth/login',
  Register: '/api/auth/register',
  Refresh: '/api/auth/refresh',
} as const;
export type ApiEndpoint = (typeof ApiEndpoint)[keyof typeof ApiEndpoint];

export const ROUTES = {
  Invalid: '**',
  Empty: '',
  Login: 'login',
  Registration: 'registration',
  Reservations: 'reservations',
  MyReservarions: 'reservations/my',
} as const;
export type AppRoutes = (typeof ROUTES)[keyof typeof ROUTES];

export const appRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [AuthGuardService],
    children: [
      { path: ROUTES.Reservations, component: ReservationsComponent, canActivate: [AuthGuardService] },
      { path: ROUTES.MyReservarions, component: InfoComponent, canActivate: [AuthGuardService] },
    ],
  },

  { path: ROUTES.Login, component: LoginComponent, canActivate: [AuthGuardService], data: { onlyWhenLoggedOut: true } },
  { path: ROUTES.Registration, component: RegisterComponent, canActivate: [AuthGuardService], data: { onlyWhenLoggedOut: true } },
  { path: ROUTES.Invalid, redirectTo: `${ROUTES.Login}`, pathMatch: 'full' },
];
