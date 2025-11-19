import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router, NavigationEnd } from '@angular/router';
import { of, from, combineLatest } from 'rxjs';
import { map, catchError, switchMap, tap, take, filter, withLatestFrom, distinctUntilChanged } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../features/users/services/user.service';
import { AppState } from '../../index';
import { selectCurrentUser, selectIsAuthenticated, selectIsLoading } from '../selectors/auth.selectors';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private store = inject(Store<AppState>);

  // Sign In Effect
  signIn$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signIn),
      switchMap(({ email, password }) =>
        this.authService.signIn({ email, password }).pipe(
          map((response) => {
            if (response.success && response.data) {
              return AuthActions.signInSuccess({
                accessToken: response.data.accessToken,
                idToken: response.data.idToken
              });
            } else {
              // Include errorName in error message if available
              let errorMessage = response.message || 'Sign in failed';
              if (response.errorName) {
                errorMessage = `[${response.errorName}] ${errorMessage}`;
              }
              return AuthActions.signInFailure({
                error: errorMessage
              });
            }
          }),
          catchError((error: any) => {
            let errorMessage = error.message || 'Sign in failed';
            // Include errorName if available
            if (error.errorName || error.name) {
              const errorName = error.errorName || error.name;
              errorMessage = `[${errorName}] ${errorMessage}`;
            }
            return of(AuthActions.signInFailure({
              error: errorMessage
            }));
          })
        )
      )
    );
  });

  // Load Profile If Needed Effect
  // Chỉ load profile nếu chưa có trong store (tránh duplicate requests)
  loadProfileIfNeeded$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.loadProfileIfNeeded),
      switchMap(() =>
        // Check xem đã có profile trong store chưa
        this.store.select(selectCurrentUser).pipe(
          take(1),
          switchMap(user => {
            if (user) {
              // Đã có profile trong store, không cần load lại
              console.log('[AuthEffects] Profile already in store, skipping load');
              return of(AuthActions.loadProfileSuccess({ user }));
            }
            // Chưa có profile, load từ API
            console.log('[AuthEffects] Profile not in store, loading from API...');
            return this.userService.getCurrentProfile().pipe(
              map((response) => {
                if (response.success) {
                  // Nếu success = true, dù data = null (user chưa có profile) vẫn dispatch success
                  // với user = null để guard có thể xử lý redirect
                  return AuthActions.loadProfileSuccess({
                    user: response.data || null
                  });
                } else {
                  return AuthActions.loadProfileFailure({
                    error: response.message || 'Failed to load profile'
                  });
                }
              }),
              catchError((error) =>
                of(AuthActions.loadProfileFailure({
                  error: error.message || 'Failed to load profile'
                }))
              )
            );
          })
        )
      )
    );
  });

  // Load Profile Effect (force load, không check store)
  loadProfile$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.loadProfile),
      switchMap(() =>
        this.userService.getCurrentProfile().pipe(
          map((response) => {
            if (response.success) {
              // Nếu success = true, dù data = null (user chưa có profile) vẫn dispatch success
              // với user = null để component có thể xử lý redirect
              return AuthActions.loadProfileSuccess({
                user: response.data || null
              });
            } else {
              return AuthActions.loadProfileFailure({
                error: response.message || 'Failed to load profile'
              });
            }
          }),
          catchError((error) =>
            of(AuthActions.loadProfileFailure({
              error: error.message || 'Failed to load profile'
            }))
          )
        )
      )
    );
  });

  // Sign Out Effect
  signOut$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signOut),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.signOutSuccess()),
          catchError(() => of(AuthActions.signOutSuccess())) // Always succeed logout locally
        )
      )
    );
  });

  // Redirect after sign out
  signOutSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signOutSuccess),
      tap(() => this.router.navigate(['/signin']))
    );
  }, { dispatch: false });

  // Update Profile Effect
  updateProfile$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.updateProfile),
      switchMap(({ profileData }) =>
        this.userService.createOrUpdateProfile(profileData).pipe(
          map((response) => {
            if (response.success && response.data) {
              return AuthActions.updateProfileSuccess({
                user: response.data
              });
            } else {
              return AuthActions.updateProfileFailure({
                error: response.message || 'Failed to update profile'
              });
            }
          }),
          catchError((error) =>
            of(AuthActions.updateProfileFailure({
              error: error.message || 'Failed to update profile'
            }))
          )
        )
      )
    );
  });

  // Initialize Auth Effect (check session on app startup)
  initAuth$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.initAuth),
      switchMap(() =>
        from(getCurrentUser()).pipe(
          switchMap(() =>
            from(fetchAuthSession({ forceRefresh: false })).pipe(
              map((session) => {
                if (session.tokens?.accessToken && session.tokens?.idToken) {
                  return AuthActions.initAuthSuccess({
                    accessToken: session.tokens.accessToken.toString(),
                    idToken: session.tokens.idToken.toString()
                  });
                } else {
                  return AuthActions.initAuthFailure();
                }
              }),
              catchError(() => of(AuthActions.initAuthFailure()))
            )
          ),
          catchError(() => of(AuthActions.initAuthFailure()))
        )
      )
    );
  });

  // Load profile after init auth success
  loadProfileAfterInit$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.initAuthSuccess),
      switchMap(() => [
        AuthActions.loadProfileIfNeeded()
      ])
    );
  });

  // Global Profile Check & Redirect Effect
  checkProfileOnNavigation$ = createEffect(() => {
    return this.router.events.pipe(
      // Chỉ xử lý khi navigation hoàn thành
      filter(event => event instanceof NavigationEnd),
      // Lấy current URL
      map(event => (event as NavigationEnd).url),
      distinctUntilChanged(), // Tránh xử lý duplicate
      // Combine với auth state
      withLatestFrom(
        this.store.select(selectIsAuthenticated),
        this.store.select(selectCurrentUser),
        this.store.select(selectIsLoading)
      ),
      // Chỉ xử lý nếu user đã authenticated
      filter(([url, isAuthenticated, user, isLoading]) => {
        // Bỏ qua nếu đang loading
        if (isLoading) return false;
        
        // Bỏ qua nếu chưa authenticated
        if (!isAuthenticated) return false;
        
        // Bỏ qua các auth routes (signin, signup, confirm-email)
        const isAuthRoute = url === '/signin' || url === '/signup' || url === '/confirm-email';
        if (isAuthRoute) return false;
        
        // Bỏ qua nếu đang ở route /profile (cho phép user vào create profile)
        const isProfileRoute = url === '/profile' || url.startsWith('/profile?');
        if (isProfileRoute) return false;
        
        // Chỉ xử lý nếu user chưa có profile
        return !user;
      }),
      // Check và load profile nếu cần
      switchMap(([url, isAuthenticated, user, isLoading]) => {
        console.log('[AuthEffects] User authenticated but no profile, checking profile...');
        // Dispatch loadProfileIfNeeded để đảm bảo profile đã được load
        this.store.dispatch(AuthActions.loadProfileIfNeeded());
        
        // Đợi profile load xong (có thể vẫn là null nếu user chưa có profile)
        return combineLatest([
          this.store.select(selectCurrentUser),
          this.store.select(selectIsLoading)
        ]).pipe(
          filter(([user, isLoading]) => !isLoading), // Đợi load xong
          take(1),
          map(([user, isLoading]) => ({ user, url }))
        );
      }),
      // Redirect nếu vẫn chưa có profile
      tap(({ user, url }) => {
        if (!user) {
          console.log('[AuthEffects] User still has no profile after check, redirecting to create profile...');
          this.router.navigate(['/profile'], {
            queryParams: { mode: 'create' }
          });
        }
      })
    );
  }, { dispatch: false }); // Không dispatch action mới
}