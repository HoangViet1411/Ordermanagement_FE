import { Routes } from '@angular/router';
import { SigninComponent } from './features/auth/components/signin/signin';
import { DashboardComponent } from './features/dashboard/dashboard';
import { SignupComponent } from './features/auth/components/signup/signup';
import { ConfirmEmailComponent } from './features/auth/components/confirm-email/confirm-email';
import { NotFoundComponent } from './features/not-found/not-found';
import { authGuard, guestGuard } from './core/guard/auth.guard';
import { ProfileComponent } from './features/user/components/profile/profile';
import { UserListComponent } from './features/user/components/user-list/user-list';
import { UserDetailComponent } from './features/user/components/user-detail/user-detail';

export const routes: Routes = [
  { path: 'signin', component: SigninComponent},
  { path: 'signup', component: SignupComponent },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'users', component: UserListComponent, canActivate: [authGuard] },
  { path: 'users/:id', component: UserDetailComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent },
];
