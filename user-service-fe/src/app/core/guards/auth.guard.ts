import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, filter, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AppState } from '../../store';
import { selectIsAuthenticated } from '../../store/auth/selectors/auth.selectors';

/**
 * Guard để bảo vệ routes cần authentication
 * Nếu user chưa đăng nhập, redirect đến trang signin
 * Profile check và redirect được xử lý bởi global effect (checkProfileOnNavigation$)
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const store = inject(Store<AppState>);

  // Đợi initAuth hoàn thành (isInitialized = true) trước khi check authentication
  return store.select(state => (state as AppState).auth.isInitialized).pipe(
    filter(isInitialized => isInitialized === true), // Chỉ tiếp tục khi đã initialized
    take(1), // Chỉ lấy giá trị đầu tiên khi isInitialized = true
    // Sau khi initAuth hoàn thành, check authentication
    switchMap(() => store.select(selectIsAuthenticated).pipe(take(1))),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        // User chưa đăng nhập, redirect đến trang signin
        router.navigate(['/signin'], {
          queryParams: { returnUrl: state.url } // Lưu URL để redirect lại sau khi sign in
        });
        return false;
      }

      // User đã đăng nhập, cho phép truy cập
      // Profile check và redirect được xử lý bởi global effect
      return true;
    })
  );
};

