import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { getCurrentUser } from 'aws-amplify/auth';
import { from } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

const createAuthGuard = (requireAuth: boolean): CanActivateFn => {
  return (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // ✅ Check từ Amplify trực tiếp (không chỉ localStorage)
    return from(getCurrentUser())
      .pipe(
        map(() => {
          // ✅ Có user từ Amplify → authenticated
          if (requireAuth) {
            return true;
          } else {
            // Guest guard: đã authenticated → redirect về dashboard
            return router.createUrlTree(['/dashboard']);
          }
        }),
        catchError(() => {
          // ✅ Không có user từ Amplify → không authenticated
          if (requireAuth) {
            // Auth guard: chưa authenticated → redirect về signin
            return of(router.createUrlTree(['/signin']));
          } else {
            // Guest guard: chưa authenticated → cho phép vào
            return of(true);
          }
        })
      );
  };
};

export const authGuard = createAuthGuard(true);
export const guestGuard = createAuthGuard(false);