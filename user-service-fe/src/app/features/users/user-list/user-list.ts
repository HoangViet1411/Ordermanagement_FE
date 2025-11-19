import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AppState } from '../../../store';
import { selectUsers, selectUsersLoading, selectUsersError, selectUsersPagination } from '../../../store/users/selectors/users.selectors';
import * as UsersActions from '../../../store/users/actions/users.actions';
import { UserService, User, ApiResponse, PaginationMeta, UserListParams } from '../services/user.service';

// Helper function to check if account is unverified
function isUnverifiedAccount(userStatus: string, email?: string): boolean {
  const status = (userStatus || '').toUpperCase();
  return status === 'UNCONFIRMED' || 
         status === 'FORCE_CHANGE_PASSWORD' ||
         (status === 'UNKNOWN' && (!email || email === 'N/A'));
}

export interface UserTableItem {
  id: number;
  name: string;
  email: string;
  enabled: boolean;
  userStatus: string;
  isDeleted?: boolean; // Track soft delete status
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'email', 'status', 'actions'];
  dataSource = new MatTableDataSource<UserTableItem>([]);
  
  loading$!: Observable<boolean>;
  searchTerm = '';
  pagination$!: Observable<PaginationMeta | null>;
  currentPage = 1;
  pageSize = 10;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.loading$ = this.store.select(selectUsersLoading);
    this.pagination$ = this.store.select(selectUsersPagination);
  }

  ngOnInit(): void {
    // Subscribe to users from store
    this.store.select(selectUsers).pipe(
      takeUntil(this.destroy$)
    ).subscribe(users => {
      // Transform data for table
      this.dataSource.data = users.map(user => ({
        id: user.id,
        name: `${user.lastName} ${user.firstName}`,
        email: user.account?.email || 'N/A',
        enabled: user.account?.enabled || false,
        userStatus: user.account?.userStatus || 'UNKNOWN',
        isDeleted: !!user.deletedAt
      }));
    });

    // Subscribe to errors
    this.store.select(selectUsersError).pipe(
      takeUntil(this.destroy$),
      filter(error => error !== null)
    ).subscribe(error => {
      if (error) {
        this.snackBar.open(error, 'Close', { duration: 5000 });
      }
    });

    // Load users on init
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    // Backend đã handle: search, pagination, filter deleted users, filter users có roles
    // Frontend chỉ cần gửi parameters và nhận kết quả đã được filter/paginate
    const params: UserListParams = {
      page: this.currentPage,
      limit: this.pageSize,
      includeAccount: 'true', // Include account info từ Cognito
      include_deleted: true // Include cả user đã bị soft delete (disable)
    };

    // Gửi search parameter lên backend nếu có search term
    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    // Dispatch action to load users
    this.store.dispatch(UsersActions.loadUsers({ params }));
  }

  onSearch(): void {
    this.currentPage = 1; // Reset về trang đầu khi search
    this.loadUsers(); // Load lại từ API với search parameter
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers(); // Load lại từ API với page mới
  }

  getStatusClass(user: UserTableItem): string {
    if (user.isDeleted) {
      return 'status-disabled';
    }
    
    if (isUnverifiedAccount(user.userStatus, user.email)) {
      return 'status-unverified';
    }
    
    return user.enabled ? 'status-enabled' : 'status-disabled';
  }

  getStatusText(user: UserTableItem): string {
    if (user.isDeleted) {
      return 'Disabled';
    }
    
    if (isUnverifiedAccount(user.userStatus, user.email)) {
      return 'Unverified';
    }
    
    return user.enabled ? 'Active' : 'Disabled';
  }

  isUserDisabled(user: UserTableItem): boolean {
    return !!user.isDeleted;
  }

  toggleAccountStatus(user: UserTableItem): void {
    const isDisabled = !!user.isDeleted;
    
    const confirmMessage = isDisabled 
      ? 'Are you sure you want to restore (enable) this account?'
      : 'Are you sure you want to disable this account?';
    
    if (confirm(confirmMessage)) {
      if (isDisabled) {
        // Restore user (enable)
        this.userService.restoreUser(user.id).subscribe({
          next: (response: ApiResponse<{ message: string }>) => {
            if (response.success) {
              this.snackBar.open(
                `Account restored successfully`,
                'Close',
                { duration: 3000 }
              );
              this.loadUsers();
            } else {
              this.snackBar.open(
                response.message || 'Failed to restore account',
                'Close',
                { duration: 5000 }
              );
            }
          },
          error: (error: any) => {
            console.error('Error restoring account:', error);
            const errorMsg = error?.error?.message || 'Failed to restore account';
            this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
          }
        });
      } else {
        // Soft delete (disable)
        this.userService.deleteUser(user.id).subscribe({
          next: (response: ApiResponse<void>) => {
            if (response.success) {
              this.snackBar.open(
                `Account disabled successfully`,
                'Close',
                { duration: 3000 }
              );
              this.loadUsers();
            } else {
              this.snackBar.open(
                response.message || 'Failed to disable account',
                'Close',
                { duration: 5000 }
              );
            }
          },
          error: (error: any) => {
            console.error('Error disabling account:', error);
            const errorMsg = error?.error?.message || 'Failed to disable account';
            this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
          }
        });
      }
    }
  }

  deleteAccount(user: UserTableItem): void {
    if (confirm(`Are you sure you want to permanently delete this account? This action cannot be undone and the user will be permanently removed from the system.`)) {
      // Hard delete - xóa vĩnh viễn khỏi database
      this.userService.hardDeleteUser(user.id).subscribe({
        next: (response: ApiResponse<void>) => {
          if (response.success) {
            this.snackBar.open(
              'Account permanently deleted',
              'Close',
              { duration: 3000 }
            );
            // Reload users after deletion
            this.loadUsers();
          } else {
            this.snackBar.open(
              response.message || 'Failed to delete account',
              'Close',
              { duration: 5000 }
            );
          }
        },
        error: (error: any) => {
          console.error('Error deleting account:', error);
          const errorMsg = error?.error?.message || 'Failed to delete account';
          this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
        }
      });
    }
  }
}

