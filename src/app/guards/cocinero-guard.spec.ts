import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { cocineroGuard } from './cocinero-guard';

describe('cocineroGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => cocineroGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
