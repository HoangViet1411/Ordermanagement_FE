import { Injectable, signal, inject } from '@angular/core';
import { from, Observable, tap, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  signOut,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { ProfileResponse, UserService } from './user.service';

export interface CurrentUser {
  userId: string;
  username: string;
  email: string;
  attributes?: Record<string, string>;
}

export interface SignInRequest { email: string; password: string; }
export interface SignUpRequest { email: string; password: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'current_user';
  private readonly PROFILE_STORAGE_KEY = 'user_profile';
  private userService = inject(UserService);

  // Signal để reactive (load từ localStorage)
  private _currentUser = signal<CurrentUser | null>(null);
  public readonly currentUser = this._currentUser.asReadonly();

  // Signal để track profile state
  private _hasProfile = signal<boolean | null>(null);
  public readonly hasProfile = this._hasProfile.asReadonly();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this._currentUser.set(user);
      } catch {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  // Load và verify user từ storage (global, có thể gọi từ nhiều nơi)
  loadAndVerifyUser(): Observable<boolean> {
    return new Observable((observer) => {
      // Load từ localStorage trước
      this.loadFromStorage();
      const storedUser = this._currentUser();

      // Nếu có user trong localStorage → verify với Amplify
      if (storedUser !== null) {
        from(getCurrentUser())
          .pipe(
            tap((user) => {
              // Verify thành công → check xem có phải cùng user không
              const currentUser: CurrentUser = {
                userId: user.userId,
                username: user.username,
                email: user.signInDetails?.loginId || '',
              };

              // Bắt buộc: Check userId để đảm bảo cùng user
              if (storedUser.userId !== currentUser.userId) {
                // User khác nhau → clear state và return false
                this.clearCurrentUser();
                observer.next(false);
                observer.complete();
                return;
              }

              // Cùng user → check xem có thay đổi không (tối ưu)
              // Dùng JSON.stringify để so sánh toàn bộ object
              if (JSON.stringify(storedUser) === JSON.stringify(currentUser)) {
                // Không có thay đổi → không cần update
                observer.next(true);
                observer.complete();
                return;
              }

              // Có thay đổi (email/username) → update
              this._currentUser.set(currentUser);
              this.saveToStorage(currentUser);
              observer.next(true);
            }),
            catchError(() => {
              // Verify thất bại → clear state
              this.clearCurrentUser();
              observer.next(false);
              return of(false);
            })
          )
          .subscribe({
            complete: () => observer.complete(),
          });
      } else {
        // Không có user → không authenticated
        observer.next(false);
        observer.complete();
      }
    });
  }

  private saveToStorage(user: CurrentUser | null): void {
    if (user) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Lưu profile vào localStorage
  private saveProfileToStorage(profile: ProfileResponse | null): void {
    if (profile && profile.success && profile.data) {
      localStorage.setItem(this.PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(this.PROFILE_STORAGE_KEY);
    }
  }

  // Lấy profile từ localStorage
  getProfileFromStorage(): ProfileResponse | null {
    const stored = localStorage.getItem(this.PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem(this.PROFILE_STORAGE_KEY);
      }
    }
    return null;
  }

  // Kiểm tra user đã authenticated chưa (từ localStorage)
  isAuthenticated(): boolean {
    return this._currentUser() !== null;
  }

  // Verify authentication với Amplify và return Observable<boolean>
  saveUserToStorage(): Observable<boolean> {
  return from(getCurrentUser()).pipe(
    tap((user) => {
      const currentUser: CurrentUser = {
        userId: user.userId,
        username: user.username,
        email: user.signInDetails?.loginId || '',
      };
      this._currentUser.set(currentUser);
      this.saveToStorage(currentUser);
    }),
    map(() => true),
    catchError(() => {
      this.clearCurrentUser();
      return of(false);
    })
  );
}


  // Clear user (dùng khi signout)
  clearCurrentUser(): void {
    this._currentUser.set(null);
    this.saveToStorage(null);
  }

  signUp(payload: SignUpRequest): Observable<any> {
    return from(signUp({
      username: payload.email,
      password: payload.password,
      options: { userAttributes: { email: payload.email } },
    }));
  }

  signIn(payload: SignInRequest): Observable<any> {
    return from(signIn({
      username: payload.email,
      password: payload.password,
      options: { authFlowType: 'USER_PASSWORD_AUTH' },
    }));
  }

  confirmSignUp(email: string, code: string): Observable<any> {
    return from(confirmSignUp({ username: email, confirmationCode: code }));
  }

  resendCode(email: string): Observable<any> {
    return from(resendSignUpCode({ username: email }));
  }

  // Check profile và return Observable để đợi kết quả
  checkProfileAndWait(): Observable<boolean> {
    return new Observable((observer) => {
      if (!this.isAuthenticated()) {
        observer.next(false);
        observer.complete();
        return;
      }

      if (this._hasProfile() === true) {
        observer.next(true);
        observer.complete();
        return;
      }

      // Check localStorage trước
      const cachedProfile = this.getProfileFromStorage();
      if (cachedProfile && cachedProfile.success && cachedProfile.data) {
        this._hasProfile.set(true);
        observer.next(true);
        observer.complete();
        return;
      }

      // Không có profile trong localStorage → gọi API và đợi response
      this.userService.getProfile().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this._hasProfile.set(true);
            this.saveProfileToStorage(response);
            observer.next(true);
          } else {
            this._hasProfile.set(false);
            this.saveProfileToStorage(null);
            observer.next(false);
          }
          observer.complete();
        },
        error: (err) => {
          if (err.status === 404) {
            this._hasProfile.set(false);
            this.saveProfileToStorage(null);
            observer.next(false);
          } else {
            observer.error(err);
          }
          observer.complete();
        },
      });
    });
  }

  // Mark profile đã được tạo (và lưu vào localStorage)
  markProfileCreated(profile?: ProfileResponse): void {
    this._hasProfile.set(true);
    if (profile) {
      this.saveProfileToStorage(profile);
    }
  }

  // Reset profile check khi logout
  resetProfileCheck(): void {
    this._hasProfile.set(null);
    this.saveProfileToStorage(null); // Xóa profile khỏi localStorage
  }

  signOutAll(): Observable<void> {
    return from(signOut({ global: true })).pipe(
      tap(() => {
        // Clear user khi signout
        this.clearCurrentUser();
        // Reset profile check
        this.resetProfileCheck();
      })
    );
  }

}
