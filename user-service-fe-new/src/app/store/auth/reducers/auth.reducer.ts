import { createReducer, on } from '@ngrx/store';
import { initialAuthState, AuthState } from '../state/auth.state';
import * as AuthActions from '../actions/auth.action';

export const authReducer = createReducer(
  initialAuthState,

  // ========== Sign In ==========
  on(AuthActions.signIn, (state) => ({
    ...state,
    isSigningIn: true,
    signInError: null,
    error: null,
  })),

  on(AuthActions.signInSuccess, (state, { currentUser }) => ({
    ...state,
    isSigningIn: false,
    isAuthenticated: true,
    currentUser,
    signInError: null,
    error: null,
  })),

  on(AuthActions.signInFailure, (state, { error }) => ({
    ...state,
    isSigningIn: false,
    isAuthenticated: false,
    signInError: error,
    error,
  })),

  // ========== Sign Up ==========
  on(AuthActions.signUp, (state) => ({
    ...state,
    isSigningUp: true,
    signUpError: null,
    error: null,
  })),

  on(AuthActions.signUpSuccess, (state) => ({
    ...state,
    isSigningUp: false,
    signUpError: null,
    error: null,
    // Note: signUpSuccess không set currentUser vì user chưa confirm email
  })),

  on(AuthActions.signUpFailure, (state, { error }) => ({
    ...state,
    isSigningUp: false,
    signUpError: error,
    error,
  })),

  // ========== Sign Out ==========
  on(AuthActions.signOut, (state) => ({
    ...state,
    isLoading: true,
  })),

  on(AuthActions.signOutSuccess, () => ({
    ...initialAuthState,
    isInitialized: true, // Quan trọng: set true để guard có thể check
  })),

  // ========== Load And Verify User ==========
  on(AuthActions.loadAndVerifyUser, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(AuthActions.loadAndVerifyUserSuccess, (state, { currentUser }) => ({
    ...state,
    isLoading: false,
    isAuthenticated: true,
    currentUser,
    error: null,
  })),

  on(AuthActions.loadAndVerifyUserFailure, (state) => ({
    ...state,
    isLoading: false,
    isAuthenticated: false,
    currentUser: null,
  })),

  // ========== Save User To Storage ==========
  on(AuthActions.saveUserToStorage, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(AuthActions.saveUserToStorageSuccess, (state, { currentUser }) => ({
    ...state,
    isLoading: false,
    isAuthenticated: true,
    currentUser,
    error: null,
  })),

  on(AuthActions.saveUserToStorageFailure, (state) => ({
    ...state,
    isLoading: false,
    isAuthenticated: false,
    currentUser: null,
  })),

  // ========== Check Profile ==========
  on(AuthActions.checkProfile, (state) => ({
    ...state,
    isCheckingProfile: true,
    error: null,
  })),

  on(AuthActions.checkProfileSuccess, (state, { hasProfile }) => ({
    ...state,
    isCheckingProfile: false,
    hasProfile,
    error: null,
  })),

  on(AuthActions.checkProfileFailure, (state, { error }) => ({
    ...state,
    isCheckingProfile: false,
    hasProfile: false,
    error: error || null,
  })),

  // ========== Initialize Auth ==========
  on(AuthActions.initAuth, (state) => ({
    ...state,
    isLoading: true,
  })),

  on(AuthActions.initAuthSuccess, (state) => ({
    ...state,
    isLoading: false,
    isInitialized: true,
  })),

  on(AuthActions.initAuthFailure, (state) => ({
    ...state,
    isLoading: false,
    isInitialized: true, // Vẫn set true để guard không bị block
  })),

  // ========== Clear Errors ==========
  on(AuthActions.clearAuthError, (state) => ({
    ...state,
    error: null,
  })),

  on(AuthActions.clearSignInError, (state) => ({
    ...state,
    signInError: null,
  })),

  on(AuthActions.clearSignUpError, (state) => ({
    ...state,
    signUpError: null,
  })),

//   Confirm Email
on(AuthActions.confirmEmail, (state) => ({
    ...state,
    isConfirmingEmail: true,
    confirmEmailError: null,
    error: null,
})),

on(AuthActions.confirmEmailSuccess, (state) => ({
    ...state,
    isConfirmingEmail: false,
    confirmEmailError: null,
    error: null,
})),

on(AuthActions.confirmEmailFailure, (state, { error }) => ({
    ...state,
    isConfirmingEmail: false,
    confirmEmailError: error,
    error: error,
})),

// Resend Code
on(AuthActions.resendCode, (state) => ({
    ...state,
    isResendingCode: true,
    resendCodeError: null,
    error: null,
})),

on(AuthActions.resendCodeSuccess, (state) => ({
    ...state,
    isResendingCode: false,
    resendCodeError: null,
    error: null,
})),

on(AuthActions.resendCodeFailure, (state, { error }) => ({
    ...state,
    isResendingCode: false,
    resendCodeError: error,
    error: error,
})),
);
