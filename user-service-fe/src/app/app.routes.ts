import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage';
import { SignInComponent } from './features/auth/components/signin/signin';
import { SignUpComponent } from './features/auth/components/signup/signup';
import { ConfirmEmailComponent } from './features/auth/components/confirm-email/confirm-email';
import { ProfileComponent } from './features/users/profile/profile';
import { PermissionComponent } from './pages/permission/permission';
import { NotFoundComponent } from './pages/not-found/not-found';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { userDetailGuard } from './core/guards/user-detail.guard';
import { UserListComponent } from './features/users/user-list/user-list';
import { UserDetailComponent } from './features/users/user-detail/user-detail';
import { EditPersonalComponent } from './features/users/edit-personal/edit-personal';
import { EditAccountComponent } from './features/users/edit-account/edit-account';
import { EditPasswordComponent } from './features/users/edit-password/edit-password';

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
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard] // Chỉ user đã đăng nhập mới được vào
  },
  {
    path: 'users/:id/edit/personal',
    component: EditPersonalComponent,
    canActivate: [userDetailGuard] // Admin hoặc user edit thông tin của chính mình
  },
  {
    path: 'users/:id/edit/account',
    component: EditAccountComponent,
    canActivate: [userDetailGuard] // Admin hoặc user edit thông tin của chính mình
  },
  {
    path: 'users/:id/edit/password',
    component: EditPasswordComponent,
    canActivate: [userDetailGuard] // Admin hoặc user edit thông tin của chính mình
  },
  {
    path: 'users/:id',
    component: UserDetailComponent,
    canActivate: [userDetailGuard] // Admin hoặc user xem detail của chính mình
  },
  {
    path: 'permission',
    component: PermissionComponent
  },
  {
    path: 'user-list',
    component: UserListComponent,
    canActivate: [adminGuard] // Chỉ admin mới được vào
  },
  {
    path: '**',
    component: NotFoundComponent // Catch all routes - 404 page
  }
];