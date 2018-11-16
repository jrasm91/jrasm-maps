import { TestBed } from '@angular/core/testing';

import { GoogleLoaderService } from './google-loader.service';

describe('GoogleLoaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GoogleLoaderService = TestBed.get(GoogleLoaderService);
    expect(service).toBeTruthy();
  });
});
