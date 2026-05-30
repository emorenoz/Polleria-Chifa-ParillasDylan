import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { meseroGuard } from './mesero-guard';

describe('meseroGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => meseroGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
