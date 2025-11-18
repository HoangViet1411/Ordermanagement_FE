import { Component, OnInit } from '@angular/core';
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
import { UserService, User, ApiResponse, PaginationMeta } from '../services/user.service';

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
export class UserListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'email', 'status', 'actions'];
  dataSource = new MatTableDataSource<UserTableItem>([]);
  
  loading = false;
  searchTerm = '';
  pagination: PaginationMeta | null = null;
  currentPage = 1;
  pageSize = 10;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    
    // Backend đã handle: search, pagination, filter deleted users, filter users có roles
    // Frontend chỉ cần gửi parameters và nhận kết quả đã được filter/paginate
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      includeAccount: 'true', // Include account info từ Cognito
      include_deleted: true // Include cả user đã bị soft delete (disable)
    };

    // Gửi search parameter lên backend nếu có search term
    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.userService.getUsers(params).subscribe({
      next: (response: ApiResponse<User[]>) => {
        if (response.success && response.data) {
          // Backend đã filter users có roles (required: true trong INNER JOIN)
          // Nên không cần filter lại ở frontend
          
          // Transform data for table
          this.dataSource.data = response.data.map(user => ({
            id: user.id,
            name: `${user.lastName} ${user.firstName}`,
            email: user.account?.email || 'N/A',
            enabled: user.account?.enabled || false,
            userStatus: user.account?.userStatus || 'UNKNOWN',
            isDeleted: !!user.deletedAt
          }));

          // Dùng pagination từ backend thay vì tính client-side
          this.pagination = response.pagination || null;
        } else {
          this.dataSource.data = [];
          this.pagination = null;
          if (!response.success) {
            this.snackBar.open(response.message || 'No users found', 'Close', { duration: 3000 });
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('[UserList] Error loading users:', error);
        const errorMsg = error?.error?.message || 'Failed to load users';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
        this.loading = false;
      }
    });
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
      this.loading = true;
      
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

  deleteAccount(user: UserTableItem): void {
    if (confirm(`Are you sure you want to permanently delete this account? This action cannot be undone and the user will be permanently removed from the system.`)) {
      this.loading = true;
      
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
}

