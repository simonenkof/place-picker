import { Routes } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { MainComponent } from './modules/login/main/main.component';
import { AuthGuardService } from './services/auth.guard.service';

export const ApiEndpoint = {
  Login: '/api/auth/login',
  Refresh: '/api/auth/refresh',
  TempStatusEvent: '/api/event/temp_status',
  BlockStatusEvent: '/api/event/block_status',
  ProgStatusEvent: '/api/event/prog_status',
  RunProgram: '/api/private/program/run',
  StopProgram: '/api/private/program/stop',
  PauseProgram: '/api/private/program/pause',
  SerialNumber: '/api/private/device/serialNumber',
  Fimware: '/api/private/device/firmware',
  User: '/api/private/user',
  UserAll: '/api/private/user/all',
  Program: '/api/private/program/all',
} as const;
export type ApiEndpoint = (typeof ApiEndpoint)[keyof typeof ApiEndpoint];

export const ROUTES = {
  Invalid: '**',
  Empty: '',
  Login: 'login',
} as const;
export type AppRoutes = (typeof ROUTES)[keyof typeof ROUTES];

export const appRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [AuthGuardService],
  },

  { path: ROUTES.Login, component: LoginComponent, canActivate: [AuthGuardService], data: { onlyWhenLoggedOut: true } },
  { path: ROUTES.Invalid, redirectTo: `${ROUTES.Login}`, pathMatch: 'full' },
];
