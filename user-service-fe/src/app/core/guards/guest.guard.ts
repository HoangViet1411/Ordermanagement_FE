import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { getCurrentUser } from 'aws-amplify/auth';

/**
 * Guard để redirect user đã authenticated ra khỏi auth pages (signin/signup)
 * Nếu user đã đăng nhập, redirect về homepage
 */
export const guestGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);

  try {
    // Check xem user có authenticated không bằng cách lấy current user từ Amplify
    await getCurrentUser();
    // User đã đăng nhập, redirect về homepage
    router.navigate(['/']);
    return false;
  } catch {
    // User chưa đăng nhập, cho phép truy cập
    return true;
  }
};

