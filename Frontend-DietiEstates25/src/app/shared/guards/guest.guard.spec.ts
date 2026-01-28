import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
  let authServiceMock: { isAuthenticated: () => boolean };
  let routerMock: { navigate: (commands: string[]) => void };
  let isAuthenticated = false;
  let navigatedTo: string[] | null = null;

  beforeEach(() => {
    isAuthenticated = false;
    navigatedTo = null;

    authServiceMock = {
      isAuthenticated: () => isAuthenticated
    };

    routerMock = {
      navigate: (commands: string[]) => { navigatedTo = commands; }
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access when user is not authenticated', () => {
    isAuthenticated = false;

    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(navigatedTo).toBeNull();
  });

  it('should deny access and redirect to home when user is authenticated', () => {
    isAuthenticated = true;

    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));

    expect(result).toBe(false);
    expect(navigatedTo).toEqual(['/']);
  });
});
