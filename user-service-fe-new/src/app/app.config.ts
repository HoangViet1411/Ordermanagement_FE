import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Amplify } from 'aws-amplify';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { environment } from '../environments/environments';
import { authInterceptor } from './core/services/auth.interceptor';
import { reducers } from './store';
import { AuthEffects } from './store/auth/effects/auth.effects';
import { UserEffects } from './store/user/effects/user.effects';
import { ProfileEffects } from './store/auth/effects/profile.effect';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.clientId,
      loginWith: { email: true, phone: false, username: false },
      signUpVerificationMethod: 'code'
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    // Sử dụng functional interceptor với withInterceptors (cách mới cho Angular standalone)
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    // NgRx Store
    provideStore(reducers),
          provideEffects([AuthEffects, ProfileEffects, UserEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
    }),
  ]
};

