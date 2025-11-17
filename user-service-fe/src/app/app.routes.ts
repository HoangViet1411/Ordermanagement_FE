import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage';
import { SignInComponent } from './features/auth/components/signin/signin';
import { SignUpComponent } from './features/auth/components/signup/signup';
import { ConfirmEmailComponent } from './features/auth/components/confirm-email/confirm-email';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomepageComponent
  },
  {
    path: 'signin',
    component: SignInComponent,
    canActivate: [guestGuard] // Redirect nếu đã đăng nhập
  },
  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [guestGuard] // Redirect nếu đã đăng nhập
  },
  {
    path: 'confirm-email',
    component: ConfirmEmailComponent,
    canActivate: [guestGuard] // Redirect nếu đã đăng nhập
  }
];