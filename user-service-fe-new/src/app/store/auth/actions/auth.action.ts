import { createAction, props } from "@ngrx/store";
import { CurrentUser } from "../../../core/services/auth.service";

// Sign In Actions
export const signIn = createAction(
    '[Auth] Sign In',
    props<{ email: string; password: string }>()
);

export const signInSuccess = createAction(
    '[Auth] Sign In Success',
    props<{ currentUser: CurrentUser }>()
);

export const signInFailure = createAction(
    '[Auth] Sign In Failure',
    props<{ error: string }>()
);

//  Sign Up Actions
export const signUp = createAction(
    '[Auth] Sign Up',
    props<{ email: string; password: string }>()
);

export const signUpSuccess = createAction(
    '[Auth] Sign Up Success',
    props<{ email: string }>()
);

export const signUpFailure = createAction(
    '[Auth] Sign Up Failure',
    props<{ error: string }>()
);

// Sign Out Actions
export const signOut = createAction(
    '[Auth] Sign Out'
);

export const signOutSuccess = createAction(
    '[Auth] Sign Out Success'
);

//  Load and Verify User Actions
export const loadAndVerifyUser = createAction(
    '[Auth] Load and Verify User'
);

export const loadAndVerifyUserSuccess = createAction(
    '[Auth] Load and Verify User Success',
    props<{ currentUser: CurrentUser }>()
);

export const loadAndVerifyUserFailure = createAction(
    '[Auth] Load and Verify User Failure',
);

// Save User to Storage Actions
export const saveUserToStorage = createAction(
    '[Auth] Save User to Storage'
);

export const saveUserToStorageSuccess = createAction(
    '[Auth] Save User to Storage Success',
    props<{ currentUser: CurrentUser }>()
);

export const saveUserToStorageFailure = createAction(
    '[Auth] Save User to Storage Failure',
);

// Check Profile Actions
export const checkProfile = createAction(
    '[Auth] Check Profile'
);

export const checkProfileSuccess = createAction(
    '[Auth] Check Profile Success',
    props<{ hasProfile: boolean }>()
);

export const checkProfileFailure = createAction(
    '[Auth] Check Profile Failure',
    props<{ error: string }>()
);

//  Initialize Auth Actions
export const initAuth = createAction(
    '[Auth] Initialize Auth'
);

export const initAuthSuccess = createAction(
    '[Auth] Initialize Auth Success'
);

export const initAuthFailure = createAction(
    '[Auth] Initialize Auth Failure'
);

// Clear Auth Error Actions
export const clearAuthError = createAction(
    '[Auth] Clear Auth Error'
);

export const clearSignInError = createAction(
    '[Auth] Clear Sign In Error'
);

export const clearSignUpError = createAction(
    '[Auth] Clear Sign Up Error'
);

// Confirm Email Actions
export const confirmEmail = createAction(
    '[Auth] Confirm Email',
    props<{ email: string; code: string }>()
);

export const confirmEmailSuccess = createAction(
    '[Auth] Confirm Email Success'
);

export const confirmEmailFailure = createAction(
    '[Auth] Confirm Email Failure',
    props<{ error: string }>()
);

// Resend Code Actions
export const resendCode = createAction(
    '[Auth] Resend Code',
    props<{ email: string }>()
);

export const resendCodeSuccess = createAction(
    '[Auth] Resend Code Success'
);

export const resendCodeFailure = createAction(
    '[Auth] Resend Code Failure',
    props<{ error: string }>()
);

// Handle Auth And Profile Actions
export const handleAuthAndProfile = createAction(
    '[Auth] Handle Auth And Profile',
    props<{ preserveCurrentRoute: boolean; useLoadAndVerify?: boolean }>()
);

// Navigation Actions
export const navigateToProfile = createAction(
    '[Auth] Navigate To Profile'
);

export const navigateToDashboard = createAction(
    '[Auth] Navigate To Dashboard'
);

export const navigateToSignIn = createAction(
    '[Auth] Navigate to Sign In'
);

// Hub Event Actions

export const hubSignedIn = createAction(
    '[Auth] Hub Signed In'
);

export const hubSignedOut = createAction(
    '[Auth] Hub Signed Out'
);

export const hubTokenRefresh = createAction(
    '[Auth] Hub Token Refresh'
);

