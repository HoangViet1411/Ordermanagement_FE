import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom } from 'rxjs/operators';
import * as UserActions from '../actions/user.action';
import { UserService } from '../../../core/services/user.service';
import { AppState } from '../../index';
import { selectUserCurrentParams, selectSelectedUser } from '../selectors/user.selectors';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private userService = inject(UserService);
  private store = inject(Store<AppState>);
  private router = inject(Router);

  // ========== Load Users Effect ==========
  loadUsers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.loadUsers),
      withLatestFrom(this.store.select(selectUserCurrentParams)),
      switchMap(([action, currentParams]) => {
        const params = {
          ...currentParams,
          ...action.params,
        };

        return this.userService.getUsers(params).pipe(
          map((response) => {
            if (response.success && response.data && response.pagination) {
              return UserActions.loadUsersSuccess({
                users: response.data,
                pagination: response.pagination,
              });
            } else {
              return UserActions.loadUsersFailure({
                error: 'Unable to load users list.',
              });
            }
          }),
          catchError((error: any) => {
            return of(
              UserActions.loadUsersFailure({
                error: error.error?.message || 'Unable to load users list.',
              })
            );
          })
        );
      })
    );
  });

  // ========== Toggle User Status Effect ==========
  toggleUserStatus$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.toggleUserStatus),
      switchMap(({ userId, isDisabled }) => {
        const action = isDisabled
          ? this.userService.restoreUser(userId)
          : this.userService.softDeleteUser(userId);

        return action.pipe(
          map((response) => {
            if (response.success) {
              return UserActions.toggleUserStatusSuccess();
            } else {
              return UserActions.toggleUserStatusFailure({
                error: response.message || 'Operation failed.',
              });
            }
          }),
          catchError((error: any) => {
            return of(
              UserActions.toggleUserStatusFailure({
                error: error.error?.message || 'Operation failed.',
              })
            );
          })
        );
      })
    );
  });

  // Reload users after toggle success
  toggleUserStatusSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.toggleUserStatusSuccess),
      map(() => UserActions.loadUsersWithCurrentParams())
    );
  });

  // ========== Hard Delete User Effect ==========
  hardDeleteUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.hardDeleteUser),
      switchMap(({ userId }) =>
        this.userService.hardDeleteUser(userId).pipe(
          map((response) => {
            if (response.success) {
              return UserActions.hardDeleteUserSuccess();
            } else {
              return UserActions.hardDeleteUserFailure({
                error: response.message || 'Failed to delete user.',
              });
            }
          }),
          catchError((error: any) => {
            return of(
              UserActions.hardDeleteUserFailure({
                error: error.error?.message || 'Failed to delete user.',
              })
            );
          })
        )
      )
    );
  });

  // Reload users after delete success
  hardDeleteUserSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.hardDeleteUserSuccess),
      map(() => UserActions.loadUsersWithCurrentParams())
    );
  });

  // ========== Load Users With Current Params Effect ==========
  loadUsersWithCurrentParams$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.loadUsersWithCurrentParams),
      withLatestFrom(this.store.select(selectUserCurrentParams)),
      switchMap(([_, currentParams]) => {
        return this.userService.getUsers(currentParams).pipe(
          map((response) => {
            if (response.success && response.data && response.pagination) {
              return UserActions.loadUsersSuccess({
                users: response.data,
                pagination: response.pagination,
              });
            } else {
              return UserActions.loadUsersFailure({
                error: 'Unable to load users list.',
              });
            }
          }),
          catchError((error: any) => {
            return of(
              UserActions.loadUsersFailure({
                error: error.error?.message || 'Unable to load users list.',
              })
            );
          })
        );
      })
    );
  });

  // ========== Change Page Effect ==========
  changePage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.changePage),
      map(() => UserActions.loadUsersWithCurrentParams())
    );
  });

    // ========== Load User Detail Effect ==========
    loadUserDetail$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(UserActions.loadUserDetail),
        switchMap(({ userId }) =>
          this.userService.getUserById(userId, true).pipe(
            map((response) => {
              if (response.success && response.data) {
                return UserActions.loadUserDetailSuccess({
                  user: response.data,
                });
              } else {
                return UserActions.loadUserDetailFailure({
                  error: response.message || 'User not found',
                });
              }
            }),
            catchError((error: any) => {
              return of(
                UserActions.loadUserDetailFailure({
                  error: error.error?.message || 'Failed to load user',
                })
              );
            })
          )
        )
      );
    });
  
    // ========== Load User Account Info Effect ==========
    loadUserAccountInfo$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(UserActions.loadUserAccountInfo),
        switchMap(({ userId }) =>
          this.userService.getUserAccount(userId).pipe(
            map((response) => {
              if (response.success && response.data) {
                return UserActions.loadUserAccountInfoSuccess({
                  accountInfo: response.data,
                });
              } else {
                // Account info failure không critical, vẫn có thể show user data
                return UserActions.loadUserAccountInfoFailure({
                  error: 'Failed to load account info',
                });
              }
            }),
            catchError((error: any) => {
              // Account info failure không critical
              return of(
                UserActions.loadUserAccountInfoFailure({
                  error: error.error?.message || 'Failed to load account info',
                })
              );
            })
          )
        )
      );
    });
  
    // Auto load account info after user detail success
    loadUserDetailSuccess$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(UserActions.loadUserDetailSuccess),
        switchMap(({ user }) => {
          const cognitoUserId = (user as any).cognitoUserId || user.cognito_user_id;
          if (cognitoUserId) {
            return [UserActions.loadUserAccountInfo({ userId: user.id })];
          }
          return [];
        })
      );
    });
  
    // ========== Toggle User Detail Status Effect ==========
    toggleUserDetailStatus$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(UserActions.toggleUserDetailStatus),
        switchMap(({ userId, isDisabled }) => {
          const action = isDisabled
            ? this.userService.restoreUser(userId)
            : this.userService.softDeleteUser(userId);
  
          return action.pipe(
            map((response) => {
              if (response.success) {
                return UserActions.toggleUserDetailStatusSuccess();
              } else {
                return UserActions.toggleUserDetailStatusFailure({
                  error: response.message || 'Operation failed.',
                });
              }
            }),
            catchError((error: any) => {
              return of(
                UserActions.toggleUserDetailStatusFailure({
                  error: error.error?.message || 'Operation failed.',
                })
              );
            })
          );
        })
      );
    });
  
    // Reload user detail after toggle success
    toggleUserDetailStatusSuccess$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(UserActions.toggleUserDetailStatusSuccess),
        switchMap((action) => {
          // Get userId from state - cần select selectedUser từ state
          return this.store.select(selectSelectedUser).pipe(
            switchMap((user) => {
              if (user) {
                return [UserActions.loadUserDetail({ userId: user.id })];
              }
              return [];
            })
          );
        })
      );
    });
  
    // ========== Delete User Detail Account Effect ==========
    deleteUserDetailAccount$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(UserActions.deleteUserDetailAccount),
        switchMap(({ userId }) =>
          this.userService.hardDeleteUser(userId).pipe(
            map((response) => {
              if (response.success) {
                return UserActions.deleteUserDetailAccountSuccess();
              } else {
                return UserActions.deleteUserDetailAccountFailure({
                  error: response.message || 'Failed to delete account',
                });
              }
            }),
            catchError((error: any) => {
              return of(
                UserActions.deleteUserDetailAccountFailure({
                  error: error.error?.message || 'Failed to delete account',
                })
              );
            })
          )
        )
      );
    });
  
    // Navigate to users list after delete success
    deleteUserDetailAccountSuccess$ = createEffect(
      () => {
        return this.actions$.pipe(
          ofType(UserActions.deleteUserDetailAccountSuccess),
          map(() => {
            this.router.navigate(['/users']);
            return { type: '[Router] Navigate' };
          })
        );
      },
      { dispatch: false }
    );
}



