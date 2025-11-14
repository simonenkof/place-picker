import { TestBed } from '@angular/core/testing';

import { DesksService } from './desks.service';

describe('DesksService', () => {
  let service: DesksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DesksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
