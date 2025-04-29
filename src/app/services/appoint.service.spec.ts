import { TestBed } from '@angular/core/testing';

import { AppointService } from './appoint.service';

describe('AppointService', () => {
  let service: AppointService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
