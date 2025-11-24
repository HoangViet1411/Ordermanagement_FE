import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, User, UsersParams, UsersResponse } from '../../../../core/services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css'],
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  users = signal<User[]>([]);

  pagination = signal({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0, 
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    const params: UsersParams = {
      page: this.pagination().page,
      limit: this.pagination().limit,
      includeAccount: 'true',
      include_deleted: true,
    };

    this.userService.getUsers(params).subscribe({
      next: (response: UsersResponse) => {
        this.loading.set(false);
        if (response.success && response.data) {
          this.users.set(response.data);
          if (response.pagination) {
            this.pagination.set({
              page: response.pagination.page,
              limit: response.pagination.limit,
              total: response.pagination.total,
              totalPages: response.pagination.totalPages,
            });
          }
        } else {
          this.errorMsg.set('Unable to load users list.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Unable to load users list.');
      },
    });
  }

  goToPage(page: number): void {
    const p = this.pagination();
    if (page >= 1 && page <= p.totalPages) {
      this.pagination.update(val => ({ ...val, page }));
      this.loadUsers();
    }
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
    if (this.loading()) return;

    const isDisabled = this.isDisabled(user);
    const action = isDisabled
      ? this.userService.restoreUser(user.id)
      : this.userService.softDeleteUser(user.id);

    this.loading.set(true);
    action.subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.loadUsers();
        } else {
          this.errorMsg.set(response.message || 'Operation failed.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Operation failed.');
      },
    });
  }

  hardDeleteUser(user: User): void {
    if (this.loading()) return;

    const email = this.getUserEmail(user);

    if (!confirm(`Are you sure you want to permanently delete user "${email !== 'N/A' ? email : user.id}"?`)) {
      return;
    }

    this.loading.set(true);
    this.userService.hardDeleteUser(user.id).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.loadUsers();
        } else {
          this.errorMsg.set(response.message || 'Failed to delete user.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Failed to delete user.');
      },
    });
  }

  viewUserDetail(user: User): void {
    this.router.navigateByUrl(`/users/${user.id}`);
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
