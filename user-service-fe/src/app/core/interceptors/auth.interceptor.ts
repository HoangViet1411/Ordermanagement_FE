import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { fetchAuthSession } from 'aws-amplify/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // Chỉ thêm token cho requests đến backend API
    const isApiRequest = req.url.startsWith('http://localhost:3000/api') || req.url.includes('/api/');
    const isCognitoRequest = req.url.includes('amazoncognito.com') || req.url.includes('amazonaws.com');
    
    if (isApiRequest && !isCognitoRequest) {
      // Lấy token từ Amplify session (async)
      return from(this.getTokenFromAmplify()).pipe(
        switchMap((token) => {
          if (token) {
            req = this.addTokenHeader(req, token);
          }
          return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
              // Nếu lỗi 401, thử refresh token
              if (error.status === 401) {
                return this.handle401Error(req, next);
              }
              return throwError(() => error);
            })
          );
        })
      );
    }

    // Không phải API request, không cần token
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && isApiRequest && !isCognitoRequest) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private async getTokenFromAmplify(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch (error) {
      return null;
    }
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      return this.authService.refreshToken().pipe(
        switchMap((authResponse: any) => {
          this.isRefreshing = false;
          if (authResponse && authResponse.accessToken) {
            return next.handle(this.addTokenHeader(request, authResponse.accessToken));
          }
          // Nếu refresh fail, logout
          this.authService.logout().subscribe();
          return throwError(() => new Error('Token refresh failed'));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          // Refresh token expired, logout user
          this.authService.logout().subscribe();
          return throwError(() => err);
        })
      );
    } else {
      // Đang refresh, đợi một chút rồi thử lại
      return from(new Promise(resolve => setTimeout(resolve, 500))).pipe(
        switchMap(() => {
          return from(this.getTokenFromAmplify()).pipe(
            switchMap((token) => {
              if (token) {
                return next.handle(this.addTokenHeader(request, token));
              }
              return throwError(() => new Error('No token available'));
            })
          );
        })
      );
    }
  }
}
