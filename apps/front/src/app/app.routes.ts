import { Routes } from '@angular/router';
import { ReserveViewDialogComponent } from './components/reserve-view-dialog/reserve-view-dialog.component';
import { InfoComponent } from './modules/info/info.component';
import { LoginComponent } from './modules/login/login.component';
import { MainComponent } from './modules/main/main.component';
import { RegisterComponent } from './modules/register/register.component';
import { ReservationsComponent } from './modules/reservations/reservations.component';
import { VerifyEmailComponent } from './modules/verify-email/verify-email.component';
import { AuthGuardService } from './services/auth.guard.service';

export const ApiEndpoint = {
  Login: '/api/auth/login',
  Register: '/api/auth/register',
  Refresh: '/api/auth/refresh',
  Verify: '/api/auth/verify',
  Desks: '/api/private/desks',
  Reservation: '/api/private/reservation',
  Me: '/api/private/user/me',
} as const;
export type ApiEndpoint = (typeof ApiEndpoint)[keyof typeof ApiEndpoint];

export const ROUTES = {
  Invalid: '**',
  Empty: '',
  Login: 'login',
  Registration: 'registration',
  VerifyEmail: 'verify-email',
  Reservations: 'reservations',
  MyReservarions: 'reservation/my',
} as const;
export type AppRoutes = (typeof ROUTES)[keyof typeof ROUTES];

export const appRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: ROUTES.Reservations,
        component: ReservationsComponent,
        canActivate: [AuthGuardService],
        children: [{ path: ':id', component: ReserveViewDialogComponent, canActivate: [AuthGuardService] }],
      },
      { path: ROUTES.MyReservarions, component: InfoComponent, canActivate: [AuthGuardService] },
    ],
  },

  { path: ROUTES.Login, component: LoginComponent, canActivate: [AuthGuardService], data: { onlyWhenLoggedOut: true } },
  { path: ROUTES.Registration, component: RegisterComponent, canActivate: [AuthGuardService], data: { onlyWhenLoggedOut: true } },
  { path: ROUTES.VerifyEmail, component: VerifyEmailComponent },
  { path: ROUTES.Invalid, redirectTo: `${ROUTES.Login}`, pathMatch: 'full' },
];
