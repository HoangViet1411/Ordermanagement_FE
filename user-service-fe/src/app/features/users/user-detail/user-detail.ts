import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { UserService, User, Gender, ApiResponse } from '../services/user.service';
import { AuthService } from '../../../core/services/auth.service';

// Helper function to check if account is unverified
function isUnverifiedAccount(userStatus: string, email?: string): boolean {
  const status = (userStatus || '').toUpperCase();
  return status === 'UNCONFIRMED' || 
         status === 'FORCE_CHANGE_PASSWORD' ||
         (status === 'UNKNOWN' && (!email || email === 'N/A'));
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css'
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = false;
  userId: number | null = null;
  isAdmin = false;

  constructor(
    private userService: UserService,
    public router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if current user is admin
    this.checkAdminRole();
    
    this.route.params.subscribe(params => {
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

  checkAdminRole(): void {
    const currentUser = this.authService.getCachedProfile();
    if (currentUser && currentUser.roles) {
      this.isAdmin = currentUser.roles.some(
        (role) => role.roleName?.toLowerCase() === 'admin'
      );
    } else {
      // If not cached, load profile
      this.authService.loadUserProfile().subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.roles) {
            this.isAdmin = response.data.roles.some(
              (role) => role.roleName?.toLowerCase() === 'admin'
            );
          }
        },
        error: (error) => {
          console.warn('[UserDetail] Failed to load current user profile:', error);
          this.isAdmin = false;
        }
      });
    }
  }

  loadUser(): void {
    if (!this.userId) return;

    this.loading = true;
    
    // Load user data and account info in parallel
    this.userService.getUserById(this.userId).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.success && response.data) {
          this.user = response.data;
          
          // Load account info separately if not included
          if (!this.user.account && this.userId) {
            this.userService.getAccountInfo(this.userId).subscribe({
              next: (accountResponse: ApiResponse<any>) => {
                if (accountResponse.success && accountResponse.data) {
                  this.user = {
                    ...this.user!,
                    account: {
                      userId: accountResponse.data.userId,
                      email: accountResponse.data.email,
                      enabled: accountResponse.data.enabled,
                      userStatus: accountResponse.data.userStatus
                    }
                  };
                }
                this.loading = false;
              },
              error: (accountError) => {
                console.warn('[UserDetail] Failed to load account info:', accountError);
                // Continue even if account info fails
                this.loading = false;
              }
            });
          } else {
            this.loading = false;
          }
        } else {
          this.snackBar.open(response.message || 'User not found', 'Close', { duration: 3000 });
          this.router.navigate(['/user-list']);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('[UserDetail] Error loading user:', error);
        const errorMsg = error?.error?.message || 'Failed to load user';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
        this.loading = false;
        this.router.navigate(['/user-list']);
      }
    });
  }

  get fullName(): string {
    if (!this.user) return '';
    return `${this.user.lastName} ${this.user.firstName}`.trim();
  }

  get genderLabel(): string {
    if (!this.user?.gender) return 'Not specified';
    return this.user.gender.charAt(0).toUpperCase() + this.user.gender.slice(1);
  }

  getStatusClass(): string {
    if (!this.user) return '';
    
    // Check if user is soft deleted (deletedAt is not null)
    if (this.user.deletedAt || this.user.isDeleted) {
      return 'status-disabled';
    }
    
    // Check if account doesn't have email - show as unverified
    if (!this.user.account || !this.user.account.email || this.user.account.email === 'N/A') {
      return 'status-unverified';
    }
    
    // Check if account exists and is unverified
    if (this.user.account && isUnverifiedAccount(this.user.account.userStatus || '', this.user.account.email)) {
      return 'status-unverified';
    }
    
    // Check account enabled status
    if (this.user.account) {
      return this.user.account.enabled ? 'status-enabled' : 'status-disabled';
    }
    
    // If no account info, default to unverified
    return 'status-unverified';
  }

  getStatusText(): string {
    if (!this.user) return '';
    
    // Check if user is soft deleted
    if (this.user.deletedAt || this.user.isDeleted) {
      return 'Disabled';
    }
    
    // Check if account doesn't have email - show as unverified
    if (!this.user.account || !this.user.account.email || this.user.account.email === 'N/A') {
      return 'Unverified';
    }
    
    // Check if account exists and is unverified
    if (this.user.account && isUnverifiedAccount(this.user.account.userStatus || '', this.user.account.email)) {
      return 'Unverified';
    }
    
    // Check account enabled status
    if (this.user.account) {
      return this.user.account.enabled ? 'Active' : 'Disabled';
    }
    
    // If no account info, default to unverified
    return 'Unverified';
  }

  // Method for Account Status in Account Information card - shows N/A if no email
  getAccountStatusClass(): string {
    if (!this.user) return '';
    
    // Check if user is soft deleted
    if (this.user.deletedAt || this.user.isDeleted) {
      return 'status-disabled';
    }
    
    // If no email, return empty class (will show N/A)
    if (!this.user.account || !this.user.account.email || this.user.account.email === 'N/A') {
      return '';
    }
    
    // Check if account exists and is unverified
    if (this.user.account && isUnverifiedAccount(this.user.account.userStatus || '', this.user.account.email)) {
      return 'status-unverified';
    }
    
    // Check account enabled status
    if (this.user.account) {
      return this.user.account.enabled ? 'status-enabled' : 'status-disabled';
    }
    
    // If no account info, return empty (will show N/A)
    return '';
  }

  getAccountStatusText(): string {
    if (!this.user) return 'N/A';
    
    // Check if user is soft deleted
    if (this.user.deletedAt || this.user.isDeleted) {
      return 'Disabled';
    }
    
    // If no email, show N/A
    if (!this.user.account || !this.user.account.email || this.user.account.email === 'N/A') {
      return 'N/A';
    }
    
    // Check if account exists and is unverified
    if (this.user.account && isUnverifiedAccount(this.user.account.userStatus || '', this.user.account.email)) {
      return 'Unverified';
    }
    
    // Check account enabled status
    if (this.user.account) {
      return this.user.account.enabled ? 'Active' : 'Disabled';
    }
    
    // If no account info, show N/A
    return 'N/A';
  }

  toggleAccountStatus(): void {
    if (!this.user) return;

    const isDisabled = !!this.user.isDeleted;
    const confirmMessage = isDisabled 
      ? 'Are you sure you want to restore (enable) this account?'
      : 'Are you sure you want to disable this account?';
    
    if (confirm(confirmMessage)) {
      this.loading = true;
      
      if (isDisabled) {
        this.userService.restoreUser(this.user.id).subscribe({
          next: (response: ApiResponse<{ message: string }>) => {
            if (response.success) {
              this.snackBar.open('Account restored successfully', 'Close', { duration: 3000 });
              this.loadUser();
            } else {
              this.snackBar.open(response.message || 'Failed to restore account', 'Close', { duration: 5000 });
              this.loading = false;
            }
          },
          error: (error: any) => {
            console.error('Error restoring account:', error);
            const errorMsg = error?.error?.message || 'Failed to restore account';
            this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
            this.loading = false;
          }
        });
      } else {
        this.userService.deleteUser(this.user.id).subscribe({
          next: (response: ApiResponse<void>) => {
            if (response.success) {
              this.snackBar.open('Account disabled successfully', 'Close', { duration: 3000 });
              this.loadUser();
            } else {
              this.snackBar.open(response.message || 'Failed to disable account', 'Close', { duration: 5000 });
              this.loading = false;
            }
          },
          error: (error: any) => {
            console.error('Error disabling account:', error);
            const errorMsg = error?.error?.message || 'Failed to disable account';
            this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
            this.loading = false;
          }
        });
      }
    }
  }

  deleteAccount(): void {
    if (!this.user) return;

    if (confirm(`Are you sure you want to permanently delete this account? This action cannot be undone and the user will be permanently removed from the system.`)) {
      this.loading = true;
      
      this.userService.hardDeleteUser(this.user.id).subscribe({
        next: (response: ApiResponse<void>) => {
          if (response.success) {
            this.snackBar.open('Account permanently deleted', 'Close', { duration: 3000 });
            this.router.navigate(['/user-list']);
          } else {
            this.snackBar.open(response.message || 'Failed to delete account', 'Close', { duration: 5000 });
            this.loading = false;
          }
        },
        error: (error: any) => {
          console.error('Error deleting account:', error);
          const errorMsg = error?.error?.message || 'Failed to delete account';
          this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
          this.loading = false;
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

  editPersonalInfo(): void {
    if (!this.user) return;
    this.router.navigate(['/users', this.user.id, 'edit', 'personal']);
  }

  editEmail(): void {
    if (!this.user) return;
    this.router.navigate(['/users', this.user.id, 'edit', 'account']);
  }

  changePassword(): void {
    if (!this.user) return;
    this.router.navigate(['/users', this.user.id, 'edit', 'password']);
  }
}