import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard để check xem user có role admin không
 * Nếu không có role admin, redirect đến trang permission
 * Sử dụng cached profile để tránh gọi API nhiều lần
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  try {
    // Lấy profile từ cache trước (không gọi API)
    let userProfile = authService.getCachedProfile();
    
    // Nếu chưa có cache, load profile từ API và lưu vào cache
    if (!userProfile) {
      const response = await firstValueFrom(authService.loadUserProfile());
      if (!response.success || !response.data) {
        console.warn('[AdminGuard] User profile not found or failed to retrieve');
        router.navigate(['/permission']);
        return false;
      }
      userProfile = response.data;
    }

    // Check xem user có role admin không
    const userRoles = userProfile.roles || [];
    const hasAdminRole = userRoles.some(
      (role) => role.roleName?.toLowerCase() === 'admin'
    );

    if (!hasAdminRole) {
      // User không có role admin, redirect đến trang permission
      console.warn('[AdminGuard] User does not have admin role. Roles:', userRoles);
      router.navigate(['/permission']);
      return false;
    }

    // User có role admin, cho phép truy cập
    return true;
  } catch (error) {
    // Lỗi khi gọi API (có thể là chưa đăng nhập, token hết hạn, etc.)
    console.error('[AdminGuard] Error checking admin role:', error);
    router.navigate(['/permission']);
    return false;
  }
};

