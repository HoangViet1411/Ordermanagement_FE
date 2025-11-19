import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { signIn, signUp, signOut, fetchAuthSession, getCurrentUser, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { UserService, User, ApiResponse as UserApiResponse } from '../../features/users/services/user.service';

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorName?: string; // Thêm errorName để component có thể detect loại error
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface SignUpResponse {
  userId: string;
  email: string;
  needsConfirmation?: boolean; // Flag để biết có cần confirm không
}

export interface ProfileCheckResult {
  hasProfile: boolean;
  profile?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Lưu user profile sau khi sign in, chỉ load 1 lần
  private currentUserProfile: User | null = null;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  /**
   * Sign in using Amplify Auth
   * Dùng USER_PASSWORD_AUTH flow để match với backend
   */
  signIn(credentials: SignInRequest): Observable<ApiResponse<AuthResponse>> {
    return from(signIn({
      username: credentials.email,
      password: credentials.password,
      options: {
        // Phải chỉ định rõ authFlowType vì Cognito chỉ enable USER_PASSWORD_AUTH
        authFlowType: 'USER_PASSWORD_AUTH'
      }
    })).pipe(
      switchMap((signInOutput) => {
        console.log('[AuthService] SignIn output:', signInOutput);
        console.log('[AuthService] isSignedIn:', signInOutput.isSignedIn);
        console.log('[AuthService] nextStep:', signInOutput.nextStep);

        // QUAN TRỌNG: Check nếu user cần confirm email trước
        // Nếu nextStep.signInStep === 'CONFIRM_SIGN_UP', user chưa verify email
        if (
          signInOutput.nextStep &&
          signInOutput.nextStep.signInStep === 'CONFIRM_SIGN_UP'
        ) {
          console.log('[AuthService] User needs to confirm email before signing in');
          console.log('[AuthService] Auto-sending confirmation code to:', credentials.email);
          
          // Tự động gửi confirmation code trước khi throw error
          return from(resendSignUpCode({
            username: credentials.email
          })).pipe(
            switchMap(() => {
              console.log('[AuthService] Confirmation code sent successfully');
              // Sau khi gửi code thành công, throw error để component redirect
              return throwError(() => ({
                name: 'UserNotConfirmedException',
                message: 'User account is not confirmed. A confirmation code has been sent to your email.',
                isSignedIn: false,
                nextStep: signInOutput.nextStep
              }));
            }),
            catchError((resendError) => {
              // Nếu gửi code fail, vẫn throw error nhưng với message khác
              console.error('[AuthService] Failed to send confirmation code:', resendError);
              return throwError(() => ({
                name: 'UserNotConfirmedException',
                message: 'User account is not confirmed. Please check your email or request a new code.',
                isSignedIn: false,
                nextStep: signInOutput.nextStep,
                resendError: resendError
              }));
            })
          );
        }

        //  QUAN TRỌNG: Chỉ fetch session nếu isSignedIn === true
        //  Nếu isSignedIn === false, có thể là:
        //  1. Account chưa confirm email (đã được xử lý ở trên)
        //  2. Credentials sai
        //  3. Có nextStep khác cần xử lý
        if (signInOutput.isSignedIn !== true) {
          console.warn('[AuthService] Sign in not completed, isSignedIn:', signInOutput.isSignedIn);
          console.warn('[AuthService] nextStep:', signInOutput.nextStep);
          return throwError(() => ({
            name: 'NotAuthorizedException',
            message: signInOutput.nextStep 
              ? 'Sign in requires additional steps. Please check your account status.'
              : 'Sign in failed. Please check your credentials.'
          }));
        }

        //  Nếu đã signed in (isSignedIn === true), tiếp tục fetch session
        // Amplify v6: signIn() có thể trả về tokens trực tiếp hoặc cần fetch session
        console.log('[AuthService] User signed in successfully, fetching session...');
        return from(fetchAuthSession({ forceRefresh: true })).pipe(
          switchMap((session) => {
            console.log('[AuthService] Session after signIn:', session);
            // Nếu có tokens, dùng luôn
            if (session.tokens) {
              console.log('[AuthService] Tokens available');
              return of(session);
            }
            // Nếu chưa có tokens, throw error
            console.error('[AuthService] No tokens after signIn');
            return throwError(() => new Error('No tokens available after sign in'));
          }),
          catchError((fetchError) => {
            // Nếu fetch session fail, throw error
            console.error('[AuthService] Fetch session failed:', fetchError);
            return throwError(() => fetchError);
          })
        );
      }),
      map((session) => {
        if (!session.tokens) {
          throw new Error('No tokens available after sign in. Please try again.');
        }

        const authResponse = this.createAuthResponseFromSession(session);

        return {
          success: true,
          data: authResponse,
          message: 'Sign in successful'
        };
      }),
      catchError((error: any) => {
        console.error('[AuthService] Sign in error:', error);
        console.error('[AuthService] Error details:', {
          name: error.name,
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          underlyingError: error.underlyingError
        });
        
        let errorMessage = 'Sign in failed';
        let errorName = error.name || '';
        
        // ✅ QUAN TRỌNG: UserNotConfirmedException cần được return với errorName để component detect
        // Component sẽ check errorName để redirect đến confirm page
        if (error.name === 'UserNotConfirmedException' || errorName === 'UserNotConfirmedException') {
          errorMessage = error.message || 'User account is not confirmed. Please check your email or request a new code.';
          errorName = 'UserNotConfirmedException';
          
          return of({
            success: false,
            message: errorMessage,
            errorName: errorName
          });
        }
        
        // Parse error từ Amplify/Cognito
        if (error.name === 'NotAuthorizedException' || error.message?.includes('Incorrect')) {
          errorMessage = 'Incorrect email or password';
        } else if (error.name === 'UserNotFoundException') {
          errorMessage = 'User not found';
        } else if (error.name === 'InvalidParameterException' || error.statusCode === 400) {
          // Handle 400 Bad Request - có thể do config sai hoặc request format sai
          errorMessage = 'Invalid request. Please check your Cognito configuration or try again.';
          if (error.message) {
            errorMessage += ` (${error.message})`;
          }
        } else if (error.name === 'InvalidPasswordException') {
          errorMessage = 'Password does not meet requirements';
        } else if (error.name === 'TooManyRequestsException') {
          errorMessage = 'Too many requests. Please try again later.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        return of({
          success: false,
          message: errorMessage,
          errorName: errorName
        });
      })
    );
  }

  /**
   * Sign up using Amplify Auth
   * Gọi trực tiếp Cognito qua Amplify
   * Nếu cần confirm, sẽ tự động confirm (nếu có thể) hoặc yêu cầu user confirm
   */
  signUp(credentials: SignUpRequest): Observable<ApiResponse<SignUpResponse>> {
    return from(signUp({
      username: credentials.email,
      password: credentials.password,
      options: {
        userAttributes: {
          email: credentials.email
        }
      }
    })).pipe(
      switchMap((output) => {
        // Lấy userId từ output
        const userId = output.userId || '';
        
        // Log output để debug
        console.log('SignUp output:', output);
        console.log('nextStep:', output.nextStep);
        
        // Kiểm tra xem có cần confirm không
        // Nếu nextStep là CONFIRM_SIGN_UP, user cần confirm qua email code
        if (output.nextStep && output.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          console.log('User needs confirmation. Redirecting to confirm page...');
          
          // Return success nhưng thông báo cần confirm
          // Component sẽ redirect đến trang confirm
          return of({
            success: true,
            data: {
              userId: userId,
              email: credentials.email,
              needsConfirmation: true // Flag để component biết cần redirect
            },
            message: 'Account created successfully. Please check your email for confirmation code.'
          });
        }
        
        // Nếu không cần confirm, return success ngay
        console.log('User does not need confirmation, account is ready to use.');
        return of({
          success: true,
          data: {
            userId: userId,
            email: credentials.email
          },
          message: 'Account created successfully'
        });
      }),
      catchError((error: any) => {
        let errorMessage = 'Sign up failed';
        
        if (error.name === 'UsernameExistsException') {
          errorMessage = 'User with this email already exists';
        } else if (error.name === 'InvalidPasswordException') {
          errorMessage = 'Password does not meet requirements';
        } else if (error.name === 'InvalidParameterException') {
          errorMessage = 'Invalid email or password format';
        } else if (error.message) {
          errorMessage = error.message;
        }

        return of({
          success: false,
          message: errorMessage
        });
      })
    );
  }

  /**
   * Confirm sign up với confirmation code
   * User sẽ nhận code qua email và nhập vào đây
   */
  confirmSignUp(username: string, confirmationCode: string): Observable<ApiResponse<void>> {
    return from(confirmSignUp({
      username: username,
      confirmationCode: confirmationCode
    })).pipe(
      map(() => {
        return {
          success: true,
          message: 'Account confirmed successfully'
        };
      }),
      catchError((error: any) => {
        let errorMessage = 'Confirmation failed';
        
        if (error.name === 'CodeMismatchException') {
          errorMessage = 'Invalid confirmation code';
        } else if (error.name === 'ExpiredCodeException') {
          errorMessage = 'Confirmation code has expired';
        } else if (error.name === 'NotAuthorizedException') {
          errorMessage = 'User is already confirmed';
        } else if (error.message) {
          errorMessage = error.message;
        }

        return of({
          success: false,
          message: errorMessage
        });
      })
    );
  }

  /**
   * Resend confirmation code
   * Gửi lại code xác thực qua email
   */
  resendConfirmationCode(username: string): Observable<ApiResponse<void>> {
    return from(resendSignUpCode({
      username: username
    })).pipe(
      map(() => {
        return {
          success: true,
          message: 'Confirmation code sent successfully. Please check your email.'
        };
      }),
      catchError((error: any) => {
        let errorMessage = 'Failed to resend confirmation code';
        
        if (error.name === 'LimitExceededException') {
          errorMessage = 'Too many attempts. Please try again later.';
        } else if (error.name === 'NotAuthorizedException') {
          errorMessage = 'User is already confirmed';
        } else if (error.name === 'UserNotFoundException') {
          errorMessage = 'User not found';
        } else if (error.message) {
          errorMessage = error.message;
        }

        return of({
          success: false,
          message: errorMessage
        });
      })
    );
  }

  /**
   * Check if user is authenticated (synchronous)
   * Note: This is not 100% accurate vì Amplify dùng async storage
   * For accurate check, use isAuthenticatedAsync()
   */
  isAuthenticated(): boolean {
    // Không thể check sync từ Amplify secure storage
    // Return true để tương thích với code hiện tại
    // Interceptor sẽ check chính xác khi gọi API
    return true;
  }

  /**
   * Check if user is authenticated (async)
   */
  async isAuthenticatedAsync(): Promise<boolean> {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load và lưu user profile sau khi sign in
   * Chỉ gọi API 1 lần và lưu vào biến
   */
  loadUserProfile(): Observable<UserApiResponse<User | null>> {
    return this.userService.getCurrentProfile().pipe(
      map((response) => {
        if (response.success && response.data) {
          // Lưu profile vào biến để dùng lại
          this.currentUserProfile = response.data;
        } else {
          // Nếu không có profile, set null
          this.currentUserProfile = null;
        }
        return response;
      }),
      catchError((error) => {
        console.error('[AuthService] Error loading profile:', error);
        this.currentUserProfile = null;
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy user profile từ cache (không gọi API)
   * Trả về null nếu chưa load profile
   */
  getCachedProfile(): User | null {
    return this.currentUserProfile;
  }

  /**
   * Refresh profile từ API (khi cần update, ví dụ sau khi edit profile)
   */
  refreshProfile(): Observable<UserApiResponse<User | null>> {
    return this.loadUserProfile();
  }

  /**
   * Clear cached profile (gọi khi logout)
   */
  clearProfile(): void {
    this.currentUserProfile = null;
  }

  /**
   * Kiểm tra profile sau khi sign-in thành công
   * Load profile và lưu vào cache
   */
  checkProfileAfterSignIn(): Observable<ProfileCheckResult> {
    return this.loadUserProfile().pipe(
      map((response) => {
        if (response.success) {
          return {
            hasProfile: !!response.data,
            profile: response.data || undefined
          };
        }
        // Nếu không success, coi như chưa có profile
        return {
          hasProfile: false
        };
      }),
      catchError((error) => {
        console.error('[AuthService] Error checking profile:', error);
        // Nếu lỗi, coi như chưa có profile
        return of({
          hasProfile: false
        });
      })
    );
  }


  /**
   * Refresh token - Amplify tự động quản lý
   * Chỉ cần fetchAuthSession() và Amplify sẽ tự refresh nếu cần
   */
  refreshToken(): Observable<AuthResponse> {
    return from(fetchAuthSession({ forceRefresh: true })).pipe(
      map((session) => {
        if (!session.tokens) {
          throw new Error('No tokens available');
        }

        return this.createAuthResponseFromSession(session);
      }),
      catchError((error) => {
        console.error('Token refresh failed:', error);
        this.router.navigate(['/signin']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout using Amplify Auth
   * Note: Lỗi network (ERR_NETWORK_CHANGED) có thể xảy ra khi logout,
   * nhưng logout vẫn thành công vì Amplify đã clear local state
   */
  logout(): Observable<ApiResponse<void>> {
    return from(signOut()).pipe(
      map(() => {
        this.clearProfile(); // Clear cached profile khi logout
        this.router.navigate(['/signin']);
        return {
          success: true,
          message: 'Logged out successfully'
        };
      }),
      catchError((error: any) => {
        // Kiểm tra các loại lỗi có thể bỏ qua:
        // 1. Network errors (ERR_NETWORK_CHANGED, ERR_INTERNET_DISCONNECTED, etc.)
        // 2. Amplify not configured
        // 3. Auth errors (token đã invalid)
        const isNetworkError = 
          error.message?.includes('ERR_NETWORK') ||
          error.message?.includes('Network') ||
          error.code === 'NETWORK_ERROR';
        
        const isAuthError = 
          error.name === 'AuthUserPoolException' ||
          error.name === 'NotAuthorizedException' ||
          error.message?.includes('not configured') ||
          error.message?.includes('Invalid session');
        
        // Nếu là network error hoặc auth error, coi như logout thành công
        // vì Amplify đã clear local state rồi
        if (isNetworkError || isAuthError) {
          if (isNetworkError) {
            console.warn('[AuthService] Network error during logout (already logged out locally):', error.message || error);
          } else {
            console.warn('[AuthService] Auth error during logout (already logged out locally):', error.name || error.message);
          }
        } else {
          console.warn('[AuthService] Logout failed, redirecting anyway:', error);
        }
        
        // Vẫn redirect về signin vì local state đã được clear
        this.router.navigate(['/signin']);
        return of({
          success: true,
          message: 'Logged out successfully'
        });
      })
    );
  }

  /**
   * Helper method để tạo AuthResponse từ Amplify session
   * Tránh code trùng lặp giữa signIn và refreshToken
   */
  private createAuthResponseFromSession(session: any): AuthResponse {
    const accessToken = session.tokens.accessToken?.toString() || '';
    const idToken = session.tokens.idToken?.toString() || '';
    const expiresIn = session.tokens.accessToken?.payload?.exp 
      ? session.tokens.accessToken.payload.exp - Math.floor(Date.now() / 1000)
      : 3600;

    return {
      accessToken: accessToken,
      refreshToken: '', // Amplify tự quản lý refresh token
      idToken: idToken,
      expiresIn: expiresIn
    };
  }
}
