import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../store';
import * as UserActions from '../../../../store/user/actions/user.action';
import {
  selectUsers,
  selectPagination,
  selectIsLoading,
  selectUserError,
} from '../../../../store/user/selectors/user.selectors';
import { User } from '../../../../core/services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css'],
})
export class UserListComponent implements OnInit {
  private store = inject(Store<AppState>);
  private router = inject(Router);

  // Selectors
  users$: Observable<User[]> = this.store.select(selectUsers);
  pagination$: Observable<any> = this.store.select(selectPagination);
  loading$: Observable<boolean> = this.store.select(selectIsLoading);
  errorMsg$: Observable<string | null> = this.store.select(selectUserError);

  ngOnInit(): void {
    // Dispatch load users action với default params
    this.store.dispatch(
      UserActions.loadUsers({
        params: {
          page: 1,
          limit: 10,
          includeAccount: 'true',
          include_deleted: true,
        },
      })
    );
  }

  goToPage(page: number): void {
    this.store.dispatch(UserActions.changePage({ page }));
  }

  // TrackBy function để tối ưu *ngFor performance
  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  getUserStatus(user: User): string {
    const deletedAt = (user as any).deletedAt || user.deleted_at;
    if (deletedAt) return 'disabled';
    const account = user.account;
    if (!account) return 'unverified';
    const status = (account.userStatus || '').toUpperCase();
    if (
      status === 'UNCONFIRMED' ||
      status === 'FORCE_CHANGE_PASSWORD' ||
      status === 'UNKNOWN'
    ) {
      return 'unverified';
    }
    if (!account.email) return 'unverified';
    if (!account.enabled) return 'disabled';
    return 'active';
  }

  getUserStatusLabel(user: User): string {
    const status = this.getUserStatus(user);
    const labels: Record<string, string> = {
      unverified: 'Unverified',
      active: 'Active',
      disabled: 'Disabled',
    };
    return labels[status] || status;
  }

  isDisabled(user: User): boolean {
    const deletedAt = (user as any).deletedAt || user.deleted_at;
    return !!deletedAt;
  }

  toggleUserStatus(user: User): void {
    const isDisabled = this.isDisabled(user);
    this.store.dispatch(
      UserActions.toggleUserStatus({ userId: user.id, isDisabled })
    );
  }

  hardDeleteUser(user: User): void {
    const email = this.getUserEmail(user);

    if (
      !confirm(
        `Are you sure you want to permanently delete user "${
          email !== 'N/A' ? email : user.id
        }"?`
      )
    ) {
      return;
    }

    this.store.dispatch(UserActions.hardDeleteUser({ userId: user.id }));
  }

  viewUserDetail(user: User): void {
    this.router.navigateByUrl(`/users/${user.id}`);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getUserName(user: User): string {
    const lastName = (user as any).lastName || user.last_name || '';
    const firstName = (user as any).firstName || user.first_name || '';
    const parts = [];
    if (lastName) parts.push(lastName);
    if (firstName) parts.push(firstName);
    return parts.length > 0 ? parts.join(' ') : 'N/A';
  }

  getUserEmail(user: User): string {
    return user.account?.email || 'N/A';
  }
}
