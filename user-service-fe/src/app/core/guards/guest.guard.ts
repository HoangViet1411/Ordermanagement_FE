import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, filter, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AppState } from '../../store';
import { selectIsAuthenticated } from '../../store/auth/selectors/auth.selectors';
import { checkAndLoadProfile } from './guard.helpers';

/**
 * Guard để redirect user đã authenticated ra khỏi auth pages (signin/signup)
 * Nếu user đã đăng nhập:
 * - Có profile → redirect về homepage
 * - Chưa có profile → redirect về create profile
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const store = inject(Store<AppState>);

  // Đợi initAuth hoàn thành trước khi check authentication
  return store.select(state => (state as AppState).auth.isInitialized).pipe(
    filter(isInitialized => isInitialized === true),
    take(1),
    switchMap(() => store.select(selectIsAuthenticated).pipe(take(1))),
    switchMap(isAuthenticated => {
      if (!isAuthenticated) {
        // User chưa đăng nhập, cho phép truy cập
        return of(true);
      }
      
      // User đã đăng nhập, check profile và redirect
      return checkAndLoadProfile(store).pipe(
        map(user => {
          if (user) {
            // User đã có profile, redirect về homepage
            router.navigate(['/']);
          } else {
            // User chưa có profile, redirect về create profile
            router.navigate(['/profile'], { queryParams: { mode: 'create' } });
          }
          return false;
        })
      );
    })
  );
};

