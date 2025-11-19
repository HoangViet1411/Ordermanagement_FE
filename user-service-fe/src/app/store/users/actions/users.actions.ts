import { createAction, props } from '@ngrx/store';
import { User, UserListParams, PaginationMeta } from '../../../features/users/services/user.service';

// Load Users Actions
export const loadUsers = createAction(
  '[Users] Load Users',
  props<{ params: UserListParams }>()
);

export const loadUsersSuccess = createAction(
  '[Users] Load Users Success',
  props<{ users: User[]; pagination: PaginationMeta | null }>()
);

export const loadUsersFailure = createAction(
  '[Users] Load Users Failure',
  props<{ error: string }>()
);

// Load User Detail Actions
export const loadUserDetail = createAction(
  '[Users] Load User Detail',
  props<{ userId: number }>()
);

export const loadUserDetailSuccess = createAction(
  '[Users] Load User Detail Success',
  props<{ user: User }>()
);

export const loadUserDetailFailure = createAction(
  '[Users] Load User Detail Failure',
  props<{ error: string }>()
);

// Clear Selected User
export const clearSelectedUser = createAction('[Users] Clear Selected User');

// Clear Users Error
export const clearUsersError = createAction('[Users] Clear Error');

