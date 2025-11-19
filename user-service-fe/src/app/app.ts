import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Hub } from 'aws-amplify/utils';
import { Subject } from 'rxjs';
import { AppState } from './store';
import * as AuthActions from './store/auth/actions/auth.actions';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Check authentication state when app starts
    this.store.dispatch(AuthActions.initAuth());

    // Listen to Amplify Hub events để tự động load profile khi sign in
    Hub.listen('auth', (data) => {
      const { payload } = data;
      console.log('[App] Amplify Hub event:', payload.event);

      switch (payload.event) {
        case 'signedIn':
          console.log('[App] User signed in, loading profile if needed...');
          this.store.dispatch(AuthActions.loadProfileIfNeeded());
          break;

        case 'signedOut':
          console.log('[App] User signed out');
          // Clear profile khi sign out
          this.store.dispatch(AuthActions.signOutSuccess());
          break;

        case 'tokenRefresh':
          console.log('[App] Token refreshed');
          break;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
