import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Hub } from 'aws-amplify/utils';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('user-service-fe-new');
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.verifyAuthOnInit();

    Hub.listen('auth', ({ payload }) => {
      const { event } = payload;

      switch (event) {
        case 'signedIn':
          // Dùng isAuthenticatedAndWait() để verify và load user
          this.authService.isAuthenticatedAndWait().subscribe({
            next: (isAuth) => {
              if (isAuth) {
                // User đã được verify và load → check profile
                this.authService.checkProfileAndWait().subscribe({
                  next: (hasProfile) => {
                    if (hasProfile) {
                      this.router.navigateByUrl('/dashboard');
                    } else {
                      this.router.navigateByUrl('/profile');
                    }
                  }
                });
              }
            }
          });
          break;

        case 'signedOut':
          this.authService.clearCurrentUser();
          this.authService.resetProfileCheck();
          break;

          case 'tokenRefresh':
      // Token đã được refresh tự động bởi Amplify
      // Chỉ cần verify user state vẫn đúng (không cần check profile)
      if (this.authService.isAuthenticated()) {
        // Có thể verify lại user state nếu cần
        this.authService.isAuthenticatedAndWait().subscribe();
      }
      }
    });
  }

  private verifyAuthOnInit(): void {
    // Dùng loadAndVerifyUser() để load từ storage và verify với Amplify
    this.authService.loadAndVerifyUser().subscribe({
      next: (isAuth) => {
        if (isAuth) {
          // User đã được verify → check profile
          this.authService.checkProfileAndWait().subscribe();
        } else {
          // Không có user hoặc verify thất bại → clear state
          this.authService.clearCurrentUser();
          this.authService.resetProfileCheck();
        }
      }
    });
  }
}