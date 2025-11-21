import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Amplify } from 'aws-amplify';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '../environments/environments';
import { authInterceptor } from './core/services/auth.interceptor';

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
  ]
};

