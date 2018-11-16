import { TestBed } from '@angular/core/testing';

import { PolygonServiceService } from './polygon-service.service';

describe('PolygonServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PolygonServiceService = TestBed.get(PolygonServiceService);
    expect(service).toBeTruthy();
  });
});
