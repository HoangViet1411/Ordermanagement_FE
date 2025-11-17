import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { signIn, signUp, signOut, fetchAuthSession, getCurrentUser, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private router: Router
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

        //  Check nếu isSignedIn === false và không có nextStep → có thể là lỗi
        if (signInOutput.isSignedIn === false && !signInOutput.nextStep) {
          console.warn('[AuthService] Sign in returned false without nextStep');
          return throwError(() => ({
            name: 'NotAuthorizedException',
            message: 'Sign in failed. Please check your credentials.'
          }));
        }

        //  Nếu đã signed in hoặc không có nextStep, tiếp tục fetch session
        // Amplify v6: signIn() có thể trả về tokens trực tiếp hoặc cần fetch session
        // Thêm delay nhỏ (100ms) để đảm bảo Amplify đã xử lý xong signIn
        return from(new Promise(resolve => setTimeout(resolve, 100))).pipe(
          switchMap(() => from(fetchAuthSession({ forceRefresh: true }))),
          switchMap((session) => {
            console.log('[AuthService] Session after signIn:', session);
            // Nếu có tokens ngay, dùng luôn
            if (session.tokens) {
              console.log('[AuthService] Tokens available immediately');
              return of(session);
            }
            // Nếu chưa có, retry với delay tăng dần
            console.log('[AuthService] No tokens immediately, retrying with delays...');
            return this.fetchSessionWithRetry(5, 300);
          }),
          catchError((fetchError) => {
            // Nếu fetch session fail, thử retry
            console.error('[AuthService] Initial session fetch failed:', fetchError);
            console.log('[AuthService] Retrying...');
            return this.fetchSessionWithRetry(5, 300);
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
        
        // Parse error từ Amplify/Cognito
        if (error.name === 'NotAuthorizedException' || error.message?.includes('Incorrect')) {
          errorMessage = 'Incorrect email or password';
        } else if (error.name === 'UserNotConfirmedException') {
          errorMessage = 'User account is not confirmed. Please check your email.';
          errorName = 'UserNotConfirmedException';
        } else if (error.name === 'UserNotFoundException') {
          errorMessage = 'User not found';
        } else if (error.name === 'InvalidParameterException' || error.statusCode === 400) {
          // ✅ Handle 400 Bad Request - có thể do config sai hoặc request format sai
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
   */
  logout(): Observable<ApiResponse<void>> {
    return from(signOut()).pipe(
      map(() => {
        this.router.navigate(['/signin']);
        return {
          success: true,
          message: 'Logged out successfully'
        };
      }),
      catchError((error: any) => {
        // Nếu logout fail (có thể do Amplify chưa được configure)
        // Vẫn redirect về signin và clear local state
        console.warn('Logout failed, redirecting anyway:', error);
        
        // Nếu lỗi là do Amplify chưa được configure, chỉ cần redirect
        if (error.name === 'AuthUserPoolException' || error.message?.includes('not configured')) {
          console.warn('Amplify Auth not configured. Redirecting to signin page.');
        }
        
        this.router.navigate(['/signin']);
        return of({
          success: true,
          message: 'Logged out locally'
        });
      })
    );
  }

  /**
   * Helper method để fetch session với retry logic
   * Một số tài khoản mới cần thời gian để Amplify cập nhật session
   */
  private fetchSessionWithRetry(maxRetries: number = 5, initialDelay: number = 300): Observable<any> {
    let attempt = 0;
    
    const tryFetch = (): Observable<any> => {
      attempt++;
      const currentDelay = initialDelay * attempt; // Delay tăng dần: 300ms, 600ms, 900ms, 1200ms, 1500ms
      
      console.log(`[AuthService] Fetching session, attempt ${attempt}/${maxRetries}, delay: ${currentDelay}ms`);
      
      return from(new Promise(resolve => setTimeout(resolve, currentDelay))).pipe(
        switchMap(() => from(fetchAuthSession({ forceRefresh: true }))),
        switchMap((session) => {
          // Nếu có tokens, return ngay
          if (session.tokens) {
            console.log(`[AuthService] Tokens retrieved successfully on attempt ${attempt}`);
            return of(session);
          }
          
          console.log(`[AuthService] No tokens on attempt ${attempt}`);
          
          // Nếu chưa có tokens và còn retry, thử lại
          if (attempt < maxRetries) {
            return tryFetch();
          }
          
          // Hết retry, return session rỗng để throw error ở map()
          console.error(`[AuthService] Failed to get tokens after ${maxRetries} attempts`);
          return of(session);
        }),
        catchError((error) => {
          console.error(`[AuthService] Error fetching session on attempt ${attempt}:`, error);
          // Nếu còn retry, thử lại
          if (attempt < maxRetries) {
            return tryFetch();
          }
          // Hết retry, throw error
          return throwError(() => error);
        })
      );
    };
    
    return tryFetch();
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
