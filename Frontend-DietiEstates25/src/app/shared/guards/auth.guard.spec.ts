import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
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

  it('should allow access when user is authenticated', () => {
    isAuthenticated = true;

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
    expect(navigatedTo).toBeNull();
  });

  it('should deny access and redirect to login when user is not authenticated', () => {
    isAuthenticated = false;

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(false);
    expect(navigatedTo).toEqual(['/login']);
  });
});
