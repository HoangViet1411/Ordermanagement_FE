import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService, User, ApiResponse } from '../services/user.service';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, Subject, of } from 'rxjs';
import { handleError } from '../utils/error-handler.helper';
import { take, switchMap, filter, takeUntil } from 'rxjs/operators';
import { AppState } from '../../../store';
import { selectIsAdmin, selectCurrentUser, selectIsAuthenticated } from '../../../store/auth/selectors/auth.selectors';
import { selectSelectedUser, selectUsersLoading, selectUsersError } from '../../../store/users/selectors/users.selectors';
import * as AuthActions from '../../../store/auth/actions/auth.actions';
import * as UsersActions from '../../../store/users/actions/users.actions';
import { calculateUserStatus } from '../utils/user-status.helper';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css'
})
export class UserDetailComponent implements OnInit, OnDestroy {
  user$!: Observable<User | null>;
  loading$!: Observable<boolean>;
  userId: number | null = null;
  isAdmin = false;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    public router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private store: Store<AppState>
  ) {
    this.user$ = this.store.select(selectSelectedUser);
    this.loading$ = this.store.select(selectUsersLoading);
  }

  ngOnInit(): void {
    // Check if current user is admin
    this.checkAdminRole();
    
    // Subscribe to errors
    this.store.select(selectUsersError).pipe(
      takeUntil(this.destroy$),
      filter(error => error !== null)
    ).subscribe(error => {
      this.snackBar.open(error!, 'Close', { duration: 5000 });
    });
    
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.userId = id;
        this.loadUser();
      } else {
        this.snackBar.open('Invalid user ID', 'Close', { duration: 3000 });
        this.router.navigate(['/user-list']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Clear selected user when leaving component
    this.store.dispatch(UsersActions.clearSelectedUser());
  }

  checkAdminRole(): void {
    // Đợi initAuth hoàn thành trước khi check admin role
    this.store.select(state => (state as AppState).auth.isInitialized).pipe(
      filter(isInitialized => isInitialized === true),
      take(1),
      switchMap(() => combineLatest([
        this.store.select(selectCurrentUser),
        this.store.select(selectIsAuthenticated)
      ]).pipe(take(1))),
      switchMap(([user, isAuthenticated]) => {
        if (!user && isAuthenticated) {
          // Profile sẽ được load tự động bởi global effect, chỉ cần đợi
          this.store.dispatch(AuthActions.loadProfileIfNeeded());
          return this.store.select(selectCurrentUser).pipe(
            filter(u => u !== null),
            take(1),
            switchMap(() => this.store.select(selectIsAdmin).pipe(take(1)))
          );
        } else if (user) {
          // User already in store, check admin role
          return this.store.select(selectIsAdmin).pipe(take(1));
        } else {
          // Not authenticated
          return of(false);
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe(isAdmin => {
      this.isAdmin = isAdmin;
    });
  }

  loadUser(): void {
    if (!this.userId) return;

    // Check if user is already in store and matches current userId
    this.store.select(selectSelectedUser).pipe(
      take(1)
    ).subscribe(selectedUser => {
      if (selectedUser && selectedUser.id === this.userId) {
        // User already loaded in store, no need to reload
        return;
      }
      
      // Dispatch action to load user detail
      this.store.dispatch(UsersActions.loadUserDetail({ userId: this.userId! }));
    });
  }

  getFullName(user: User | null): string {
    if (!user) return '';
    return `${user.lastName} ${user.firstName}`.trim();
  }

  getGenderLabel(user: User | null): string {
    if (!user?.gender) return 'Not specified';
    return user.gender.charAt(0).toUpperCase() + user.gender.slice(1);
  }

  getStatusClass(user: User | null): string {
    return calculateUserStatus(user, false).class;
  }

  getStatusText(user: User | null): string {
    return calculateUserStatus(user, false).text;
  }

  // Method for Account Status in Account Information card - shows N/A if no email
  getAccountStatusClass(user: User | null): string {
    return calculateUserStatus(user, true).class;
  }

  getAccountStatusText(user: User | null): string {
    return calculateUserStatus(user, true).text;
  }

  toggleAccountStatus(user: User): void {
    if (!user) return;

    const isDisabled = !!user.isDeleted;
    const confirmMessage = isDisabled 
      ? 'Are you sure you want to restore (enable) this account?'
      : 'Are you sure you want to disable this account?';
    
    if (confirm(confirmMessage)) {
      if (isDisabled) {
        this.userService.restoreUser(user.id).subscribe({
          next: (response: ApiResponse<{ message: string }>) => {
            if (response.success) {
              this.snackBar.open('Account restored successfully', 'Close', { duration: 3000 });
              this.loadUser();
            } else {
              this.snackBar.open(response.message || 'Failed to restore account', 'Close', { duration: 5000 });
            }
          },
          error: (error: any) => {
            handleError(error, this.snackBar, 'Failed to restore account', 'Error restoring account:');
          }
        });
      } else {
        this.userService.deleteUser(user.id).subscribe({
          next: (response: ApiResponse<void>) => {
            if (response.success) {
              this.snackBar.open('Account disabled successfully', 'Close', { duration: 3000 });
              this.loadUser();
            } else {
              this.snackBar.open(response.message || 'Failed to disable account', 'Close', { duration: 5000 });
            }
          },
          error: (error: any) => {
            handleError(error, this.snackBar, 'Failed to disable account', 'Error disabling account:');
          }
        });
      }
    }
  }

  deleteAccount(user: User): void {
    if (!user) return;

    if (confirm(`Are you sure you want to permanently delete this account? This action cannot be undone and the user will be permanently removed from the system.`)) {
      this.userService.hardDeleteUser(user.id).subscribe({
        next: (response: ApiResponse<void>) => {
          if (response.success) {
            this.snackBar.open('Account permanently deleted', 'Close', { duration: 3000 });
            this.router.navigate(['/user-list']);
          } else {
            this.snackBar.open(response.message || 'Failed to delete account', 'Close', { duration: 5000 });
          }
        },
        error: (error: any) => {
          handleError(error, this.snackBar, 'Failed to delete account', 'Error deleting account:');
        }
      });
    }
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  formatUserStatus(status: string | null | undefined): string {
    if (!status) return 'N/A';
    
    const statusMap: { [key: string]: string } = {
      'CONFIRMED': 'Verified',
      'UNCONFIRMED': 'Unverified',
      'FORCE_CHANGE_PASSWORD': 'Force Change Password',
      'UNKNOWN': 'Unknown'
    };
    
    return statusMap[status.toUpperCase()] || status;
  }

  editPersonalInfo(user: User): void {
    if (!user) return;
    this.router.navigate(['/users', user.id, 'edit', 'personal']);
  }

  editEmail(user: User): void {
    if (!user) return;
    this.router.navigate(['/users', user.id, 'edit', 'account']);
  }

  changePassword(user: User): void {
    if (!user) return;
    this.router.navigate(['/users', user.id, 'edit', 'password']);
  }

  goBack(): void {
    // Quay về user-list
    this.router.navigate(['/user-list']);
  }
}