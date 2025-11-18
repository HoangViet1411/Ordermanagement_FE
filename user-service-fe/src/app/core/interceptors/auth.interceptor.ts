import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { fetchAuthSession } from 'aws-amplify/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // 👉 Kiểm tra và bỏ qua hoàn toàn các request đến Cognito/AWS
    // Amplify tự quản lý authentication với Cognito, không cần interceptor can thiệp
    const isCognitoRequest =
      req.url.includes('amazoncognito.com') ||
      req.url.includes('cognito-idp') ||
      req.url.includes('amazonaws.com');

    // 👉 Nếu request đi đến Cognito/AWS → pass through ngay lập tức, KHÔNG can thiệp
    if (isCognitoRequest) {
      return next.handle(req);
    }

    // 👉 Còn lại (backend API) → attach token
    return from(this.getTokenFromAmplify()).pipe(
      switchMap((token) => {
        if (token) {
          req = this.addTokenHeader(req, token);
        } else {
          console.error('[AuthInterceptor] No token available');
          return throwError(() => new Error('Access token is required'));
        }

        return next.handle(req).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              return this.handle401Error(req, next);
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  private async getTokenFromAmplify(): Promise<string | null> {
    try {
      const session = await fetchAuthSession({ forceRefresh: false });
      return session.tokens?.accessToken?.toString() || null;
    } catch (error) {
      console.error('[AuthInterceptor] fetchAuthSession error:', error);
      return null;
    }
  }

  private addTokenHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      return this.authService.refreshToken().pipe(
        switchMap((res: any) => {
          this.isRefreshing = false;

          if (res?.accessToken) {
            return next.handle(this.addTokenHeader(req, res.accessToken));
          }

          this.authService.logout().subscribe();
          return throwError(() => new Error('Token refresh failed'));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.authService.logout().subscribe();
          return throwError(() => err);
        })
      );
    }

    // Nếu đang refresh thì retry ngay
    return from(this.getTokenFromAmplify()).pipe(
      switchMap(token => {
        if (token) {
          return next.handle(this.addTokenHeader(req, token));
        }
        return throwError(() => new Error('No token available'));
      })
    );
  }
}
