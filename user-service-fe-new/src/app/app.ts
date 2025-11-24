import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Hub } from 'aws-amplify/utils';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Để remove listener khi destroy (cho sạch sẽ)
  private removeHubListener?: () => void;
  
  // Counter để track số lần handleAuthAndProfile được gọi
  private handleAuthAndProfileCallCount = 0;

  ngOnInit(): void {
    // 1. Khi app load lần đầu -> check auth và profile
    this.checkAuthOnInit();

    // 2. Lắng nghe các sự kiện Auth từ Amplify
    this.removeHubListener = Hub.listen('auth', ({ payload }) => {
      const { event } = payload;

      switch (event) {
        case 'signedIn': {
          // Vừa login thành công -> navigate to dashboard nếu có profile
          console.log('[App] Hub event: signedIn - calling handleAuthAndProfile');
          this.handleAuthAndProfile({ preserveCurrentRoute: false, useLoadAndVerify: false });
          break;
        }

        case 'signedOut': {
          // Logout hoặc session bị clear -> clear state
          console.log('[App] Hub event: signedOut - clearing user state');
          this.authService.clearCurrentUser();
          this.authService.resetProfileCheck();
          this.router.navigateByUrl('/signin');
          break;
        }

        case 'tokenRefresh': {
          // Amplify đã tự refresh token xong
          // Chỉ cần đảm bảo state user vẫn khớp (không cần check profile lại)
          this.authService.saveUserToStorage().subscribe();
          break;
        }

        default:
          break;
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup Hub listener
    this.removeHubListener?.();
  }

  private checkAuthOnInit(): void {
    const currentUrl = this.router.url;
    const guestRoutes = ['/signin', '/signup', '/confirm-email'];
    const isOnGuestRoute = guestRoutes.some(route => currentUrl.startsWith(route));

    console.log('[App] checkAuthOnInit called', { currentUrl, isOnGuestRoute });
    // Chỉ verify auth nếu không đang ở guest route
    if (!isOnGuestRoute) {
      console.log('[App] checkAuthOnInit - calling handleAuthAndProfile');
      this.handleAuthAndProfile({ preserveCurrentRoute: true, useLoadAndVerify: true });
    } else {
      console.log('[App] checkAuthOnInit - skipping (on guest route)');
    }
  }

  private handleAuthAndProfile(options: { preserveCurrentRoute: boolean; useLoadAndVerify?: boolean }): void {
    // Tăng counter và log
    this.handleAuthAndProfileCallCount++;
    const callId = this.handleAuthAndProfileCallCount;
    const timestamp = new Date().toISOString();
    console.log(`[App] handleAuthAndProfile CALL #${callId} at ${timestamp}`, {
      preserveCurrentRoute: options.preserveCurrentRoute,
      useLoadAndVerify: options.useLoadAndVerify,
      stackTrace: new Error().stack
    });

    // Chọn method verify dựa trên options
    const verifyMethod = options.useLoadAndVerify
      ? this.authService.loadAndVerifyUser()
      : this.authService.saveUserToStorage();

    verifyMethod.subscribe({
      next: (isAuth) => {
        console.log(`[App] handleAuthAndProfile CALL #${callId} - verifyMethod.next:`, { isAuth });
        if (isAuth) {
          // User đã được verify → check profile
          console.log(`[App] handleAuthAndProfile CALL #${callId} - Starting checkProfileAndWait`);
          this.authService.checkProfileAndWait().subscribe({
            next: (hasProfile) => {
              console.log(`[App] handleAuthAndProfile CALL #${callId} - checkProfileAndWait.next:`, { hasProfile, preserveCurrentRoute: options.preserveCurrentRoute });
              if (!hasProfile) {
                // Chưa có profile -> ép về trang /profile
                console.log(`[App] handleAuthAndProfile CALL #${callId} - No profile, navigating to /profile`);
                this.router.navigateByUrl('/profile');
              } else if (!options.preserveCurrentRoute) {
                // Có profile và không preserve route → navigate to dashboard
                console.log(`[App] handleAuthAndProfile CALL #${callId} - Has profile, navigating to /dashboard`);
                this.router.navigateByUrl('/dashboard');
              } else {
                console.log(`[App] handleAuthAndProfile CALL #${callId} - Has profile, preserving current route`);
              }
              // Nếu preserveCurrentRoute = true và có profile -> giữ nguyên route hiện tại
            },
            error: (err) => {
              console.error(`[App] handleAuthAndProfile CALL #${callId} - checkProfileAndWait.error:`, err);
            },
            complete: () => {
              console.log(`[App] handleAuthAndProfile CALL #${callId} - checkProfileAndWait.complete`);
            }
          });
        } else {
          // Không có user hoặc verify thất bại -> clear state
          console.log(`[App] handleAuthAndProfile CALL #${callId} - Not authenticated, clearing state`);
          this.authService.clearCurrentUser();
          this.authService.resetProfileCheck();
        }
      },
      error: (err) => {
        // Lỗi bất ngờ -> reset cho chắc
        console.error(`[App] handleAuthAndProfile CALL #${callId} - verifyMethod.error:`, err);
        this.authService.clearCurrentUser();
        this.authService.resetProfileCheck();
        this.router.navigateByUrl('/signin');
      },
      complete: () => {
        console.log(`[App] handleAuthAndProfile CALL #${callId} - verifyMethod.complete`);
      }
    });
  }
} 
