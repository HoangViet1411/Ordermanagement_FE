import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as UsersActions from '../actions/users.actions';
import { UserService } from '../../../features/users/services/user.service';

@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  private userService = inject(UserService);

  // Load Users Effect
  loadUsers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UsersActions.loadUsers),
      switchMap(({ params }) =>
        this.userService.getUsers(params).pipe(
          map((response) => {
            if (response.success && response.data) {
              return UsersActions.loadUsersSuccess({
                users: response.data,
                pagination: response.pagination || null
              });
            } else {
              return UsersActions.loadUsersFailure({
                error: response.message || 'Failed to load users'
              });
            }
          }),
          catchError((error) =>
            of(UsersActions.loadUsersFailure({
              error: error.message || 'Failed to load users'
            }))
          )
        )
      )
    );
  });

  // Load User Detail Effect
  loadUserDetail$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UsersActions.loadUserDetail),
      switchMap(({ userId }) =>
        this.userService.getUserById(userId, true).pipe(
          switchMap((response) => {
            if (response.success && response.data) {
              const user = response.data;
              
              // Load account info separately if not included
              if (!user.account) {
                return this.userService.getAccountInfo(userId).pipe(
                  map((accountResponse) => {
                    if (accountResponse.success && accountResponse.data) {
                      return UsersActions.loadUserDetailSuccess({
                        user: {
                          ...user,
                          account: {
                            userId: accountResponse.data.userId,
                            email: accountResponse.data.email,
                            enabled: accountResponse.data.enabled,
                            userStatus: accountResponse.data.userStatus
                          }
                        }
                      });
                    }
                    return UsersActions.loadUserDetailSuccess({ user });
                  }),
                  catchError(() => 
                    of(UsersActions.loadUserDetailSuccess({ user }))
                  )
                );
              }
              
              return of(UsersActions.loadUserDetailSuccess({ user }));
            } else {
              return of(UsersActions.loadUserDetailFailure({
                error: response.message || 'Failed to load user detail'
              }));
            }
          }),
          catchError((error) =>
            of(UsersActions.loadUserDetailFailure({
              error: error.message || 'Failed to load user detail'
            }))
          )
        )
      )
    );
  });
}

