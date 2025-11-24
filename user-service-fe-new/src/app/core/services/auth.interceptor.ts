import { HttpInterceptorFn } from '@angular/common/http';
import { from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { fetchAuthSession } from 'aws-amplify/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isCognitoRequest =
    req.url.includes('amazoncognito.com') ||
    req.url.includes('cognito-idp') ||
    req.url.includes('amazonaws.com');

  if (isCognitoRequest) {
    return next(req);
  }

  return from(getTokenFromAmplify()).pipe(
    switchMap((token) => {
      const clonedReq = token
        ? req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          })
        : req;

      return next(clonedReq).pipe(
        catchError((error) => {
          // Xử lý 401 - Token hết hạn
          if (error.status === 401) {
            return from(refreshTokenAndRetry()).pipe(
              switchMap((newToken) => {
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                });
                return next(retryReq);
              }),
              catchError(() => {
                // Refresh thất bại → có thể redirect về signin
                return throwError(() => error);
              })
            );
          }
          return throwError(() => error);
        })
      );
    })
  );
};

async function getTokenFromAmplify(): Promise<string | null> {
  try {
    const session = await fetchAuthSession({ forceRefresh: false });
    return session.tokens?.accessToken?.toString() || null;
  } catch (error) {
    return null;
  }
}

// Function mới: Refresh token khi 401
async function refreshTokenAndRetry(): Promise<string> {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    const token = session.tokens?.accessToken?.toString();
    if (!token) {
      throw new Error('No token after refresh');
    }
    return token;
  } catch (error) {
    throw error;
  }
}