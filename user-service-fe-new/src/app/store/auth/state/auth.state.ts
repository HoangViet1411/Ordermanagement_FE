import { CurrentUser } from "../../../core/services/auth.service";

export interface AuthState {
    // User info
    currentUser: CurrentUser | null;

    // Auth status
    isAuthenticated: boolean;
    isInitialized: boolean;

    // Profile status
    hasProfile: boolean | null;

    // loading state
    isLoading: boolean;
    isSigningIn: boolean;
    isSigningUp: boolean;
    isCheckingProfile: boolean;
    isConfirmingEmail: boolean;
    isResendingCode: boolean;

    // Error state
    error: string | null;
    signInError: string | null;
    signUpError: string | null;
    confirmEmailError: string | null;
    resendCodeError: string | null;

    // Tokens
    accessToken: string | null;
    idToken: string | null;
}

export const initialAuthState: AuthState = {
    currentUser: null,
    isAuthenticated: false,
    isInitialized: false,
    hasProfile: null,
    isLoading: false,
    isSigningIn: false,
    isSigningUp: false,
    isCheckingProfile: false,
    isConfirmingEmail: false,
    isResendingCode: false,
    error: null,
    signInError: null,
    signUpError: null,
    confirmEmailError: null,
    resendCodeError: null,
    accessToken: null,
    idToken: null,
};