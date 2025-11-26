import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { of, from } from 'rxjs';
import { map, catchError, switchMap, tap, take } from 'rxjs/operators';
import { getCurrentUser } from 'aws-amplify/auth';
import * as AuthActions from '../actions/auth.action';
import { selectIsAuthenticated } from '../selectors/auth.selectors';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { AppState } from '../../../store';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private store = inject(Store<AppState>);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  // ========== Sign In Effect ==========
  signIn$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signIn),
      switchMap(({ email, password }) =>
        this.authService.signIn({ email, password }).pipe(
          switchMap(() =>
            // Sau khi signIn thành công, lấy currentUser từ Amplify
            from(getCurrentUser()).pipe(
              map((user) => {
                const currentUser = {
                  userId: user.userId,
                  username: user.username,
                  email: user.signInDetails?.loginId || '',
                };
                return AuthActions.signInSuccess({ currentUser });
              }),
              catchError((error: any) => {
                const code = error?.name || error?.code;
                let errorMessage = 'Đăng nhập thất bại. Thử lại sau.';
                
                if (code === 'NotAuthorizedException') {
                  errorMessage = 'Email hoặc mật khẩu không đúng.';
                } else if (code === 'UserNotFoundException') {
                  errorMessage = 'Không tìm thấy tài khoản.';
                }
                
                return of(AuthActions.signInFailure({ error: errorMessage }));
              })
            )
          ),
          catchError((error: any) => {
            const code = error?.name || error?.code;
            let errorMessage = 'Đăng nhập thất bại. Thử lại sau.';
            
            if (code === 'NotAuthorizedException') {
              errorMessage = 'Email hoặc mật khẩu không đúng.';
            } else if (code === 'UserNotFoundException') {
              errorMessage = 'Không tìm thấy tài khoản.';
            }
            
            return of(AuthActions.signInFailure({ error: errorMessage }));
          })
        )
      )
    );
  });

  // ========== Sign Up Effect ==========
  signUp$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signUp),
      switchMap(({ email, password }) =>
        this.authService.signUp({ email, password }).pipe(
          map(() => AuthActions.signUpSuccess({ email })),
          catchError((error: any) => {
            // Map lỗi Cognito giống như component cũ
            const code = error?.name || error?.code;
            let errorMessage = 'Đăng ký thất bại. Thử lại sau.';
            
            if (code === 'UsernameExistsException') {
              errorMessage = 'Email này đã được sử dụng.';
            } else if (code === 'InvalidPasswordException') {
              errorMessage = 'Mật khẩu không đáp ứng yêu cầu.';
            } else if (code === 'InvalidParameterException') {
              errorMessage = 'Thông tin không hợp lệ.';
            }
            
            return of(AuthActions.signUpFailure({ error: errorMessage }));
          })
        )
      )
    );
  });

  // Navigate sau khi sign up thành công
  signUpSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signUpSuccess),
      tap((action) => {
        // Navigate đến confirm-email với email trong state
        this.router.navigate(['/confirm-email'], {
          state: { email: action.email }
        });
      })
    );
  }, { dispatch: false });

  // ========== Sign Out Effect ==========
  signOut$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signOut),
      switchMap(() => {
        // Clear state ngay lập tức trước khi signOut
        this.authService.clearCurrentUser();
        this.authService.resetProfileCheck();
        
        // Dispatch success ngay lập tức, không đợi Amplify
        // Amplify signOut có thể mất thời gian hoặc fail, nhưng ta vẫn cần complete effect
        
        // Thử signOut với Amplify nhưng không block
        this.authService.signOutAll().pipe(
          catchError(() => of(null)) // Ignore error
        ).subscribe();
        
        // Return success ngay lập tức
        return of(AuthActions.signOutSuccess());
      })
    );
  });

  // Redirect sau khi sign out
  signOutSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signOutSuccess),
      tap(() => {
        this.router.navigate(['/signin']);
      })
    );
  }, { dispatch: false });

  // ========== Load And Verify User Effect ==========
  loadAndVerifyUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.loadAndVerifyUser),
      switchMap(() =>
        this.authService.loadAndVerifyUser().pipe(
          switchMap((isAuth: boolean) => {
            if (isAuth) {
              // Lấy currentUser từ service
              const currentUser = this.authService.currentUser();
              if (currentUser) {
                return of(AuthActions.loadAndVerifyUserSuccess({ currentUser }));
              }
            }
            return of(AuthActions.loadAndVerifyUserFailure());
          }),
          catchError(() => of(AuthActions.loadAndVerifyUserFailure()))
        )
      )
    );
  });

  // ========== Save User To Storage Effect ==========
  saveUserToStorage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.saveUserToStorage),
      switchMap(() =>
        this.authService.saveUserToStorage().pipe(
          switchMap((success: boolean) => {
            if (success) {
              const currentUser = this.authService.currentUser();
              if (currentUser) {
                return of(AuthActions.saveUserToStorageSuccess({ currentUser }));
              }
            }
            return of(AuthActions.saveUserToStorageFailure());
          }),
          catchError(() => of(AuthActions.saveUserToStorageFailure()))
        )
      )
    );
  });

  // ========== Check Profile Effect ==========
  checkProfile$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.checkProfile),
      switchMap(() =>
        this.authService.checkProfileAndWait().pipe(
          map((hasProfile: boolean) => AuthActions.checkProfileSuccess({ hasProfile })),
          catchError((error: any) => {
            // 404 = chưa có profile (không phải lỗi)
            if (error.status === 404) {
              return of(AuthActions.checkProfileSuccess({ hasProfile: false }));
            }
            return of(AuthActions.checkProfileFailure({ error: error.message || 'Unknown error' }));
          })
        )
      )
    );
  });

  // ========== Confirm Email Effect ==========
  confirmEmail$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.confirmEmail),
      switchMap(({ email, code }) =>
        this.authService.confirmSignUp(email, code).pipe(
          map(() => AuthActions.confirmEmailSuccess()),
          catchError((error: any) => {
            const errorCode = error?.name || error?.code;
            let errorMessage = 'Xác nhận thất bại. Thử lại sau.';
            
            if (errorCode === 'CodeMismatchException') {
              errorMessage = 'Mã xác nhận không đúng.';
            } else if (errorCode === 'ExpiredCodeException') {
              errorMessage = 'Mã xác nhận đã hết hạn. Vui lòng gửi lại mã mới.';
            } else if (errorCode === 'UserNotFoundException' || errorCode === 'AliasExistsException') {
              errorMessage = 'Email này chưa được đăng ký.';
            }
            
            return of(AuthActions.confirmEmailFailure({ error: errorMessage }));
          })
        )
      )
    );
  });

//   Mavigate sau khi confirm email thành công
  confirmEmailSuccess$ = createEffect(() => {
    return this.actions$.pipe(
        ofType(AuthActions.confirmEmailSuccess),
        tap(() => this.router.navigate(['/signin']))
    );
  }, { dispatch: false });

// ========== Resend Code Effect ==========
resendCode$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.resendCode),
      switchMap(({ email }) =>
        this.authService.resendCode(email).pipe(
          map(() => AuthActions.resendCodeSuccess()),
          catchError((error: any) => {
            const errorCode = error?.name || error?.code;
            let errorMessage = 'Không thể gửi lại mã. Thử lại sau.';
            
            if (errorCode === 'UserNotFoundException' || errorCode === 'AliasExistsException') {
              errorMessage = 'Email này chưa được đăng ký.';
            }
            
            return of(AuthActions.resendCodeFailure({ error: errorMessage }));
          })
        )
      )
    );
  });

  // ========== Handle Auth And Profile Effect ==========
  handleAuthAndProfile$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.handleAuthAndProfile),
      switchMap(({ preserveCurrentRoute, useLoadAndVerify }) => {
        // Verify user
        const verifyAction = useLoadAndVerify
          ? AuthActions.loadAndVerifyUser()
          : AuthActions.saveUserToStorage();
        
        // Dispatch verify action
        this.store.dispatch(verifyAction);
        
        // Wait for verify success/failure
        return this.actions$.pipe(
          ofType(
            AuthActions.loadAndVerifyUserSuccess,
            AuthActions.saveUserToStorageSuccess,
            AuthActions.loadAndVerifyUserFailure,
            AuthActions.saveUserToStorageFailure,
            // Nếu signOut được dispatch trong lúc này, cancel effect này
            AuthActions.signOut
          ),
          take(1),
          switchMap((action) => {
            // Nếu signOut được dispatch, cancel effect này
            if (action.type === AuthActions.signOut.type) {
              return of(AuthActions.initAuthSuccess());
            }
            
            // If verify success -> check profile
            if (
              action.type === AuthActions.loadAndVerifyUserSuccess.type ||
              action.type === AuthActions.saveUserToStorageSuccess.type
            ) {
              // Dispatch check profile action
              this.store.dispatch(AuthActions.checkProfile());
              
              // Wait for check profile result
              return this.actions$.pipe(
                ofType(
                  AuthActions.checkProfileSuccess,
                  AuthActions.checkProfileFailure,
                  // Nếu signOut được dispatch trong lúc này, cancel effect này
                  AuthActions.signOut
                ),
                take(1),
                map((profileAction) => {
                  // Nếu signOut được dispatch, cancel effect này
                  if (profileAction.type === AuthActions.signOut.type) {
                    return AuthActions.initAuthSuccess();
                  }
                  
                  if (profileAction.type === AuthActions.checkProfileSuccess.type) {
                    const hasProfile = (profileAction as any).hasProfile;
                    
                    if (!hasProfile) {
                      // No profile - navigate to profile
                      return AuthActions.navigateToProfile();
                    } else if (!preserveCurrentRoute) {
                      // Has profile and not preserve - navigate to dashboard
                      return AuthActions.navigateToDashboard();
                    }
                    // Has profile and preserve - dispatch initAuthSuccess để complete
                    return AuthActions.initAuthSuccess();
                  } else {
                    // Check profile failed - dispatch initAuthSuccess để complete
                    return AuthActions.initAuthSuccess();
                  }
                })
              );
            } else {
              // Verify failed - dispatch initAuthSuccess để complete (không navigate, let guard handle)
              return of(AuthActions.initAuthSuccess());
            }
          }),
          // Thêm catchError để tránh treo
          catchError(() => {
            // Nếu có lỗi, vẫn dispatch initAuthSuccess để complete
            return of(AuthActions.initAuthSuccess());
          })
        );
      })
    );
  });

  // Navigation Effects
  navigateToProfile$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.navigateToProfile),
      tap(() => this.router.navigate(['/profile']))
    );
  }, { dispatch: false });

  navigateToDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.navigateToDashboard),
      tap(() => this.router.navigate(['/dashboard']))
    );
  }, { dispatch: false });

  navigateToSignIn$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.navigateToSignIn),
      tap(() => this.router.navigate(['/signin']))
    );
  }, { dispatch: false });

  // ========== Hub Event Effects ==========
  hubSignedIn$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.hubSignedIn),
      map(() => AuthActions.handleAuthAndProfile({ 
        preserveCurrentRoute: false, 
        useLoadAndVerify: false 
      }))
    );
  });

  hubSignedOut$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.hubSignedOut),
      // Check state thay vì route để tránh loop (an toàn hơn)
      switchMap(() => {
        return this.store.select(selectIsAuthenticated).pipe(
          take(1),
          switchMap((isAuthenticated) => {
            if (!isAuthenticated) {
              // Đã signOut rồi, không cần dispatch signOut nữa (tránh loop)
              return of(AuthActions.initAuthSuccess()); // Chỉ complete effect
            }
            
            // Vẫn authenticated → dispatch signOut
            return of(AuthActions.signOut());
          })
        );
      })
    );
  });

  hubTokenRefresh$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.hubTokenRefresh),
      map(() => AuthActions.saveUserToStorage())
    );
  });


}