import 'zone.js';
import 'zone.js/testing';

import { TestBed } from '@angular/core/testing';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AlertService } from './app/services/alert.service';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

const alertServiceMock = {
  show: jest.fn().mockReturnValue(of(void 0)),
} as unknown as jest.Mocked<AlertService>;

const activatedRouteMock = {
  snapshot: {
    paramMap: new Map([['id', '1']]),
  },
} as unknown as jest.Mocked<ActivatedRoute>;

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AlertService, useValue: alertServiceMock },
      { provide: ActivatedRoute, useValue: activatedRouteMock },
    ],
  });
});
