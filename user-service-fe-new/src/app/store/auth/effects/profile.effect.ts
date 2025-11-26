import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import * as ProfileActions from '../actions/profile.action';
import * as AuthActions from '../../auth/actions/auth.action';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppState } from '../../../store';

@Injectable()
export class ProfileEffects {
    private actions$ = inject(Actions);
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private store = inject(Store<AppState>);

    // load profile
    loadProfile$ = createEffect(() => {
        return this.actions$.pipe(
          ofType(ProfileActions.loadProfile),
          switchMap(() => {
            // Lấy từ localStorage trước (cache)
            const cachedProfile = this.authService.getProfileFromStorage();
            
            if (cachedProfile && cachedProfile.success && cachedProfile.data) {
              // Có cache → return success ngay
              return of(ProfileActions.loadProfileSuccess({ profile: cachedProfile }));
            } else {
              // Không có cache → gọi API
              return this.userService.getProfile().pipe(
                map((response) => {
                  // Lưu vào localStorage sau khi load thành công
                  if (response.success && response.data) {
                    this.authService.markProfileCreated(response);
                  }
                  return ProfileActions.loadProfileSuccess({ profile: response });
                }),
                catchError((error: any) => {
                  // 404 = chưa có profile (không phải lỗi)
                  if (error.status === 404) {
                    return of(ProfileActions.loadProfileSuccess({ 
                      profile: { success: false, data: null, message: 'No profile' } as any 
                    }));
                  }
                  const errorMessage = error.error?.message || 'Không thể tải profile. Thử lại sau.';
                  return of(ProfileActions.loadProfileFailure({ error: errorMessage }));
                })
              );
            }
          })
        );
      });
    // ========== Create Or Update Profile Effect ==========
  createOrUpdateProfile$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProfileActions.createOrUpdateProfile),
      switchMap(({ profileData }) =>
        this.userService.createOrUpdateProfile(profileData).pipe(
          map((response) => {
            // Lưu vào localStorage sau khi create/update thành công
            if (response.success) {
              this.authService.markProfileCreated(response);
              // Update auth state hasProfile = true
              this.store.dispatch(AuthActions.checkProfileSuccess({ hasProfile: true }));
            }
            return ProfileActions.createOrUpdateProfileSuccess({ profile: response });
          }),
          catchError((error: any) => {
            let errorMessage = 'Không thể lưu profile. Thử lại sau.';
            
            if (error.error?.errors) {
              // Validation errors từ backend
              errorMessage = error.error.message || 'Validation error';
            }
            
            return of(ProfileActions.createOrUpdateProfileFailure({ error: errorMessage }));
          })
        )
      )
    );
  });

   // Navigate sau khi create/update profile thành công
   createOrUpdateProfileSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProfileActions.createOrUpdateProfileSuccess),
      tap(() => this.router.navigate(['/dashboard']))
    );
  }, { dispatch: false });
    
}