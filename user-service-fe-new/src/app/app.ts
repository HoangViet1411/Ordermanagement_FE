import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Hub } from 'aws-amplify/utils';
import { Store } from '@ngrx/store';
import { AppState } from './store';
import * as AuthActions from './store/auth/actions/auth.action';
import { selectIsInitialized, selectIsAuthenticated } from './store/auth/selectors/auth.selectors';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);
  private router = inject(Router);
  
  // Để remove listener khi destroy
  private removeHubListener?: () => void;

  ngOnInit(): void {
    // 1. Khi app load lần đầu -> check auth và profile
    this.checkAuthOnInit();

    // 2. Lắng nghe các sự kiện Auth từ Amplify
    this.setupHubListener();
  }

  ngOnDestroy(): void {
    // Cleanup Hub listener
    this.removeHubListener?.();
  }

  private checkAuthOnInit(): void {
    const currentUrl = this.router.url;
    const guestRoutes = ['/signin', '/signup', '/confirm-email'];
    const isOnGuestRoute = guestRoutes.some(route => currentUrl.startsWith(route));
    
    // Chỉ verify auth nếu không đang ở guest route
    if (!isOnGuestRoute) {
      this.store.dispatch(AuthActions.handleAuthAndProfile({ 
        preserveCurrentRoute: true, 
        useLoadAndVerify: true 
      }));
    } else {
      // Vẫn dispatch initAuthSuccess để set isInitialized = true
      this.store.dispatch(AuthActions.initAuthSuccess());
    }
  }

  private setupHubListener(): void {
    this.removeHubListener = Hub.listen('auth', ({ payload }) => {
      const { event } = payload;

      switch (event) {
        case 'signedIn': {
          // Vừa login thành công -> dispatch action
          this.store.dispatch(AuthActions.hubSignedIn());
          break;
        }

        case 'signedOut': {
          // Logout hoặc session bị clear -> dispatch action
          // Check state thay vì route để tránh loop (an toàn hơn)
          this.store.select(selectIsAuthenticated).pipe(take(1)).subscribe(isAuthenticated => {
            if (isAuthenticated) {
              // Chỉ dispatch nếu user vẫn authenticated (tránh loop khi đã signOut)
              this.store.dispatch(AuthActions.hubSignedOut());
            }
          });
          break;
        }

        case 'tokenRefresh': {
          // Amplify đã tự refresh token xong -> dispatch action
          this.store.dispatch(AuthActions.hubTokenRefresh());
          break;
        }

        default:
          break;
      }
    });
  }
}