import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../core/services/user.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../../../../store/index';
import * as UserActions from '../../../../store/user/actions/user.action';
import {
  selectSelectedUser,
  selectIsLoadingDetail,
  selectUserDetailError,
} from '../../../../store/user/selectors/user.selectors';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.html',
  styleUrls: ['./user-detail.css'],
})
export class UserDetailComponent implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Observables từ store
  user$: Observable<User | null> = this.store.select(selectSelectedUser);
  loading$: Observable<boolean> = this.store.select(selectIsLoadingDetail);
  errorMsg$: Observable<string | null> = this.store.select(selectUserDetailError);

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = +params['id'];
      if (id) {
        this.store.dispatch(UserActions.loadUserDetail({ userId: id }));
      } else {
        this.store.dispatch(
          UserActions.loadUserDetailFailure({ error: 'Invalid user ID' })
        );
        this.router.navigate(['/users']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Clear user detail khi component destroy
    this.store.dispatch(UserActions.clearUserDetail());
  }

  getFullName(user: User | null): string {
    if (!user) return '';
    const lastName = (user as any).lastName || user.last_name || '';
    const firstName = (user as any).firstName || user.first_name || '';
    return `${lastName} ${firstName}`.trim() || 'N/A';
  }

  getGenderLabel(user: User | null): string {
    if (!user || !user.gender) return 'Not specified';
    return user.gender.charAt(0).toUpperCase() + user.gender.slice(1);
  }

  getStatusClass(user: User | null): string {
    if (!user) return 'status-disabled';
    const deletedAt = (user as any).deletedAt || user.deleted_at;
    if (deletedAt) return 'status-disabled';
    const account = user.account;
    if (!account) return 'status-unverified';
    const status = (account.userStatus || '').toUpperCase();
    if (this.isUnverifiedAccount(status, account.email)) return 'status-unverified';
    if (!account.enabled) return 'status-disabled';
    return 'status-active';
  }

  private isUnverifiedAccount(userStatus: string, email?: string): boolean {
    const status = (userStatus || '').toUpperCase();
    return (
      status === 'UNCONFIRMED' ||
      status === 'FORCE_CHANGE_PASSWORD' ||
      (status === 'UNKNOWN' && (!email || email === 'N/A'))
    );
  }

  getStatusText(user: User | null): string {
    if (!user) return 'Disabled';
    const deletedAt = (user as any).deletedAt || user.deleted_at;
    if (deletedAt) return 'Disabled';
    const account = user.account;
    if (!account) return 'Unverified';
    const status = (account.userStatus || '').toUpperCase();
    if (this.isUnverifiedAccount(status, account.email)) return 'Unverified';
    if (!account.enabled) return 'Disabled';
    return 'Active';
  }

  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  }

  formatUserStatus(status: string | null | undefined): string {
    if (!status) return 'N/A';
    const statusMap: Record<string, string> = {
      CONFIRMED: 'Verified',
      UNCONFIRMED: 'Unverified',
      FORCE_CHANGE_PASSWORD: 'Force Change Password',
      UNKNOWN: 'Unknown',
    };
    return statusMap[status.toUpperCase()] || status;
  }

  toggleAccountStatus(user: User | null): void {
    if (!user) return;

    this.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      if (loading) return;

      const isDisabled = this.isUserDisabled(user);
      const confirmMessage = isDisabled
        ? 'Are you sure you want to enable this account?'
        : 'Are you sure you want to disable this account?';

      if (!confirm(confirmMessage)) {
        return;
      }

      this.store.dispatch(
        UserActions.toggleUserDetailStatus({
          userId: user.id,
          isDisabled,
        })
      );
    });
  }

  deleteAccount(user: User | null): void {
    if (!user) return;

    this.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      if (loading) return;

      if (
        !confirm(
          'Are you sure you want to permanently delete this account? This action cannot be undone and the user will be permanently removed from the system.'
        )
      ) {
        return;
      }

      this.store.dispatch(
        UserActions.deleteUserDetailAccount({ userId: user.id })
      );
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  getUserFirstName(user: User | null): string {
    if (!user) return 'N/A';
    return (user as any).firstName || user.first_name || 'N/A';
  }

  getUserLastName(user: User | null): string {
    if (!user) return 'N/A';
    return (user as any).lastName || user.last_name || 'N/A';
  }

  getUserBirthDate(user: User | null): string | null {
    if (!user) return null;
    return (user as any).birthDate || user.birth_date || null;
  }

  isUserDisabled(user: User | null): boolean {
    if (!user) return false;
    return !!(user as any).deletedAt || !!user.deleted_at;
  }

  getUserRoles(user: User | null): any[] {
    if (!user) return [];
    return (user as any)?.roles || [];
  }

  hasRoles(user: User | null): boolean {
    const roles = this.getUserRoles(user);
    return roles.length > 0;
  }
}