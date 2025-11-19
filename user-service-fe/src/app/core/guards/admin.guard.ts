import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take, switchMap, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { AppState } from '../../store';
import { selectIsAdmin, selectIsAuthenticated } from '../../store/auth/selectors/auth.selectors';
import { checkAndLoadProfile } from './guard.helpers';

/**
 * Guard để check xem user có role admin không
 * Nếu không có role admin, redirect đến trang permission
 * Sử dụng NgRx Store để check admin role
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const store = inject(Store<AppState>);

  // Đợi initAuth hoàn thành trước khi check
  return store.select(state => (state as AppState).auth.isInitialized).pipe(
    filter(isInitialized => isInitialized === true),
    take(1),
    switchMap(() => store.select(selectIsAuthenticated).pipe(take(1))),
    switchMap(isAuthenticated => {
      if (!isAuthenticated) {
        router.navigate(['/signin']);
        return of(false);
      }

      // Load profile vào store (nếu chưa có) để selectIsAdmin có data
      // Profile redirect được xử lý bởi global effect
      // Nếu user không có profile → effect sẽ redirect đến /profile?mode=create
      // Nếu user có profile nhưng không phải admin → redirect đến /permission
      return checkAndLoadProfile(store).pipe(
              switchMap(() => store.select(selectIsAdmin).pipe(take(1))),
              map(isAdmin => {
                if (!isAdmin) {
                  console.warn('[AdminGuard] User does not have admin role');
                  router.navigate(['/permission']);
                  return false;
                }
                return true;
        })
      );
    })
  );
};

