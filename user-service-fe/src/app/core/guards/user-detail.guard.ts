import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard để check xem user có thể xem user detail không
 * Cho phép nếu:
 * 1. User có role admin (có thể xem bất kỳ user nào)
 * 2. User đang xem detail của chính mình
 */
export const userDetailGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  try {
    // Lấy user ID từ route params
    const targetUserId = route.params['id'];
    if (!targetUserId) {
      router.navigate(['/permission']);
      return false;
    }

    // Lấy profile từ cache trước (không gọi API)
    let userProfile = authService.getCachedProfile();
    
    // Nếu chưa có cache, load profile từ API và lưu vào cache
    if (!userProfile) {
      const response = await firstValueFrom(authService.loadUserProfile());
      if (!response.success || !response.data) {
        console.warn('[UserDetailGuard] User profile not found or failed to retrieve');
        router.navigate(['/signin']);
        return false;
      }
      userProfile = response.data;
    }

    // Check xem user có role admin không
    const userRoles = userProfile.roles || [];
    const hasAdminRole = userRoles.some(
      (role) => role.roleName?.toLowerCase() === 'admin'
    );

    // Nếu là admin, cho phép xem bất kỳ user nào
    if (hasAdminRole) {
      return true;
    }

    // Nếu không phải admin, chỉ cho phép xem detail của chính mình
    const currentUserId = userProfile.id?.toString();
    if (currentUserId === targetUserId) {
      return true;
    }

    // User không phải admin và không phải đang xem detail của chính mình
    console.warn('[UserDetailGuard] User does not have permission to view this user detail');
    router.navigate(['/permission']);
    return false;
  } catch (error) {
    // Lỗi khi gọi API (có thể là chưa đăng nhập, token hết hạn, etc.)
    console.error('[UserDetailGuard] Error checking permission:', error);
    router.navigate(['/signin']);
    return false;
  }
};

