import { Routes } from '@angular/router';
import { SigninComponent } from './features/auth/components/signin/signin';
import { DashboardComponent } from './features/dashboard/dashboard';
import { SignupComponent } from './features/auth/components/signup/signup';
import { ConfirmEmailComponent } from './features/auth/components/confirm-email/confirm-email';
import { NotFoundComponent } from './features/not-found/not-found';
import { authGuard, guestGuard } from './core/guard/auth.guard';
import { ProfileComponent } from './features/user/components/profile/profile';

export const routes: Routes = [
  { path: 'signin', component: SigninComponent, canActivate: [guestGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [guestGuard] },
  { path: 'confirm-email', component: ConfirmEmailComponent, canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent },
];
