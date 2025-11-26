import { createAction, props } from '@ngrx/store';
import { User, UsersParams, UsersResponse, Pagination } from '../../../core/services/user.service';

// Load Users Actions
export const loadUsers = createAction(
  '[User] Load Users',
  props<{ params?: UsersParams }>()
);

// Load Users without params (use current params from state)
export const loadUsersWithCurrentParams = createAction(
  '[User] Load Users With Current Params'
);

export const loadUsersSuccess = createAction(
  '[User] Load Users Success',
  props<{ users: User[]; pagination: Pagination }>()
);

export const loadUsersFailure = createAction(
  '[User] Load Users Failure',
  props<{ error: string }>()
);

// Toggle User Status Actions
export const toggleUserStatus = createAction(
  '[User] Toggle User Status',
  props<{ userId: number; isDisabled: boolean }>()
);

export const toggleUserStatusSuccess = createAction(
  '[User] Toggle User Status Success'
);

export const toggleUserStatusFailure = createAction(
  '[User] Toggle User Status Failure',
  props<{ error: string }>()
);

// Hard Delete User Actions
export const hardDeleteUser = createAction(
  '[User] Hard Delete User',
  props<{ userId: number }>()
);

export const hardDeleteUserSuccess = createAction(
  '[User] Hard Delete User Success'
);

export const hardDeleteUserFailure = createAction(
  '[User] Hard Delete User Failure',
  props<{ error: string }>()
);

// Change Page Action
export const changePage = createAction(
  '[User] Change Page',
  props<{ page: number }>()
);

// Clear Error Action
export const clearUserError = createAction(
  '[User] Clear Error'
);

// ========== Load User Detail Actions ==========
export const loadUserDetail = createAction(
  '[User] Load User Detail',
  props<{ userId: number }>()
);

export const loadUserDetailSuccess = createAction(
  '[User] Load User Detail Success',
  props<{ user: User }>()
);

export const loadUserDetailFailure = createAction(
  '[User] Load User Detail Failure',
  props<{ error: string }>()
);

// ========== Load User Account Info Actions ==========
export const loadUserAccountInfo = createAction(
  '[User] Load User Account Info',
  props<{ userId: number }>()
);

export const loadUserAccountInfoSuccess = createAction(
  '[User] Load User Account Info Success',
  props<{ accountInfo: { userId: string; email: string; enabled: boolean; userStatus: string } }>()
);

export const loadUserAccountInfoFailure = createAction(
  '[User] Load User Account Info Failure',
  props<{ error: string }>()
);

// ========== Toggle User Detail Status Actions ==========
export const toggleUserDetailStatus = createAction(
  '[User] Toggle User Detail Status',
  props<{ userId: number; isDisabled: boolean }>()
);

export const toggleUserDetailStatusSuccess = createAction(
  '[User] Toggle User Detail Status Success'
);

export const toggleUserDetailStatusFailure = createAction(
  '[User] Toggle User Detail Status Failure',
  props<{ error: string }>()
);

// ========== Delete User Detail Account Actions ==========
export const deleteUserDetailAccount = createAction(
  '[User] Delete User Detail Account',
  props<{ userId: number }>()
);

export const deleteUserDetailAccountSuccess = createAction(
  '[User] Delete User Detail Account Success'
);

export const deleteUserDetailAccountFailure = createAction(
  '[User] Delete User Detail Account Failure',
  props<{ error: string }>()
);

// ========== Clear User Detail Action ==========
export const clearUserDetail = createAction(
  '[User] Clear User Detail'
);

