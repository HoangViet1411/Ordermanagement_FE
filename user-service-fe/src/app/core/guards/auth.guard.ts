import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { getCurrentUser } from 'aws-amplify/auth';

/**
 * Guard để bảo vệ routes cần authentication
 * Nếu user chưa đăng nhập, redirect đến trang signin
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);

  try {
    // Check xem user có authenticated không
    await getCurrentUser();
    // User đã đăng nhập, cho phép truy cập
    return true;
  } catch {
    // User chưa đăng nhập, redirect đến trang signin
    router.navigate(['/signin'], {
      queryParams: { returnUrl: state.url } // Lưu URL để redirect lại sau khi sign in
    });
    return false;
  }
};

