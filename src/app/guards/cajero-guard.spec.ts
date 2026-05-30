import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { cajeroGuard } from './cajero-guard';

describe('cajeroGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => cajeroGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
