import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../state/auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

// Basic selectors
export const selectCurrentUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.currentUser
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);

export const selectIsInitialized = createSelector(
  selectAuthState,
  (state: AuthState) => state.isInitialized
);

export const selectHasProfile = createSelector(
  selectAuthState,
  (state: AuthState) => state.hasProfile
);

// Loading selectors
export const selectIsLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoading
);

export const selectIsSigningIn = createSelector(
  selectAuthState,
  (state: AuthState) => state.isSigningIn
);

export const selectIsSigningUp = createSelector(
  selectAuthState,
  (state: AuthState) => state.isSigningUp
);

export const selectIsCheckingProfile = createSelector(
  selectAuthState,
  (state: AuthState) => state.isCheckingProfile
);

// Error selectors
export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);

export const selectSignInError = createSelector(
  selectAuthState,
  (state: AuthState) => state.signInError
);

export const selectSignUpError = createSelector(
  selectAuthState,
  (state: AuthState) => state.signUpError
);

export const selectIsConfirmingEmail = createSelector(
    selectAuthState,
    (state: AuthState) => state.isConfirmingEmail
);

export const selectIsResendingCode = createSelector(
    selectAuthState,
    (state: AuthState) => state.isResendingCode
);

export const selectConfirmEmailError = createSelector(
    selectAuthState,
    (state: AuthState) => state.confirmEmailError
);

export const selectResendCodeError = createSelector(
    selectAuthState,
    (state: AuthState) => state.resendCodeError
);
