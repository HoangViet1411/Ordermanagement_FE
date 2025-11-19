import { createReducer, on } from '@ngrx/store';
import { initialAuthState, AuthState } from '../state/auth.state';
import * as AuthActions from '../actions/auth.actions';

export const authReducer = createReducer(
  initialAuthState,
  
  // Sign In
  on(AuthActions.signIn, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  
  on(AuthActions.signInSuccess, (state, { accessToken, idToken }) => ({
    ...state,
    isLoading: false,
    isAuthenticated: true,
    accessToken,
    idToken,
    error: null
  })),
  
  on(AuthActions.signInFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    isAuthenticated: false,
    error
  })),
  
  // Load Profile
  on(AuthActions.loadProfile, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  
  on(AuthActions.loadProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    isLoading: false,
    error: null
  })),
  
  on(AuthActions.loadProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  
  // Update Profile
  on(AuthActions.updateProfile, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  
  on(AuthActions.updateProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    isLoading: false,
    error: null
  })),
  
  on(AuthActions.updateProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  
  // Sign Out
  on(AuthActions.signOut, (state) => ({
    ...state,
    isLoading: true
  })),
  
  on(AuthActions.signOutSuccess, () => ({
    ...initialAuthState,
    isInitialized: true // Set true để guard có thể check và cho phép navigate đến signin
  })),
  
  // Initialize Auth
  on(AuthActions.initAuth, (state) => ({
    ...state,
    isLoading: true
  })),
  
  on(AuthActions.initAuthSuccess, (state, { accessToken, idToken }) => ({
    ...state,
    isAuthenticated: true,
    accessToken,
    idToken,
    isLoading: false,
    isInitialized: true, // Đánh dấu đã initialized
    error: null
  })),
  
  on(AuthActions.initAuthFailure, (state) => ({
    ...state,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true, // Đánh dấu đã initialized (dù thất bại)
    error: null
  })),
  
  // Clear Error
  on(AuthActions.clearAuthError, (state) => ({
    ...state,
    error: null
  }))
);

// Export AuthState type for use in index.ts
export type { AuthState };