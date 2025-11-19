import { createAction, props } from '@ngrx/store';
import { User, Gender } from '../../../features/users/services/user.service';

// Sign In Actions
export const signIn = createAction(
  '[Auth] Sign In',
  props<{ email: string; password: string }>()
);

export const signInSuccess = createAction(
  '[Auth] Sign In Success',
  props<{ accessToken: string; idToken: string }>()
);

export const signInFailure = createAction(
  '[Auth] Sign In Failure',
  props<{ error: string }>()
);

// Load Profile Actions
export const loadProfile = createAction('[Auth] Load Profile');

export const loadProfileIfNeeded = createAction('[Auth] Load Profile If Needed');

export const loadProfileSuccess = createAction(
  '[Auth] Load Profile Success',
  props<{ user: User | null }>()
);

export const loadProfileFailure = createAction(
  '[Auth] Load Profile Failure',
  props<{ error: string }>()
);

// Update Profile Actions
export const updateProfile = createAction(
  '[Auth] Update Profile',
  props<{ profileData: { first_name: string; last_name: string; birth_date?: string; gender?: Gender } }>()
);

export const updateProfileSuccess = createAction(
  '[Auth] Update Profile Success',
  props<{ user: User }>()
);

export const updateProfileFailure = createAction(
  '[Auth] Update Profile Failure',
  props<{ error: string }>()
);

// Sign Out Actions
export const signOut = createAction('[Auth] Sign Out');

export const signOutSuccess = createAction('[Auth] Sign Out Success');

// Initialize Auth (check session on app startup)
export const initAuth = createAction('[Auth] Init Auth');

export const initAuthSuccess = createAction(
  '[Auth] Init Auth Success',
  props<{ accessToken: string; idToken: string }>()
);

export const initAuthFailure = createAction('[Auth] Init Auth Failure');

// Clear Error
export const clearAuthError = createAction('[Auth] Clear Error');