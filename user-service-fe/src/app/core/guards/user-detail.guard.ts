import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take, switchMap, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { AppState } from '../../store';
import { selectIsAuthenticated } from '../../store/auth/selectors/auth.selectors';
import { checkAndLoadProfile } from './guard.helpers';

/**
 * Guard để check xem user có thể xem user detail không
 * Cho phép nếu:
 * 1. User có role admin (có thể xem bất kỳ user nào)
 * 2. User đang xem detail của chính mình
 */
export const userDetailGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const store = inject(Store<AppState>);

  // Lấy user ID từ route params và validate
  const targetUserId = route.params['id'];
  if (!targetUserId) {
    router.navigate(['/permission']);
    return of(false);
  }
  
  // Validate user ID phải là số hợp lệ
  const userIdNumber = Number.parseInt(targetUserId, 10);
  if (Number.isNaN(userIdNumber) || userIdNumber <= 0) {
    console.warn('[UserDetailGuard] Invalid user ID:', targetUserId);
    router.navigate(['/permission']);
    return of(false);
  }

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

      // Lấy current user từ store (sử dụng helper)
      // Profile redirect được xử lý bởi global effect
      // Sử dụng closure để có thể truy cập userIdNumber và targetUserId
      return checkAndLoadProfile(store).pipe(
        map(userProfile => {
          // Nếu không có user profile sau khi load xong → user chưa có profile
          // Effect sẽ tự động redirect, nhưng guard vẫn cần return false để block route
          if (!userProfile) {
            console.warn('[UserDetailGuard] User does not have profile');
            return false;
          }

          // Check xem user có role admin không
          const userRoles = userProfile.roles || [];
          const hasAdminRole = userRoles.some(
            (role: any) => role.roleName?.toLowerCase() === 'admin'
          );

          // Nếu là admin, cho phép xem bất kỳ user nào
          if (hasAdminRole) {
            return true;
          }

          // Nếu không phải admin, chỉ cho phép xem detail của chính mình
          // So sánh cả string và number để đảm bảo match
          const currentUserId = userProfile.id?.toString();
          if (currentUserId === targetUserId || userProfile.id === userIdNumber) {
            return true;
          }

          // User không phải admin và không phải đang xem detail của chính mình
          console.warn('[UserDetailGuard] User does not have permission to view this user detail');
          router.navigate(['/permission']);
          return false;
        })
      );
    })
  );
};

