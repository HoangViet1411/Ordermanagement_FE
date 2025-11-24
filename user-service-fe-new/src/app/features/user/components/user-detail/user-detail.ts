import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User, UserResponse } from '../../../../core/services/user.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';


@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './user-detail.html',
    styleUrls: ['./user-detail.css'],
})
export class UserDetailComponent implements OnInit {
    private userService = inject(UserService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    
    loading = signal(false);
    errorMsg = signal<string | null>(null);
    user = signal<User | null >(null);
    userId: number | null = null;

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            if (id) {
                this.userId = id;
                this.loadUser();
            } else {
                this.errorMsg.set('Invalid user ID');
                this.router.navigate(['/users']);
            }
        });
    }

    loadUser(): void {
        if (!this.userId) return;

        this.loading.set(true);
        this.errorMsg.set(null);

        this.userService.getUserById(this.userId, true).subscribe({
            next: (response: UserResponse) => {
                if (response.success && response.data) {
                    this.user.set(response.data);
                    const cognitoUserId = (response.data as any).cognitoUserId || response.data.cognito_user_id;
                    if (cognitoUserId) {
                        this.loadAccountInfo();
                    } else {
                        this.loading.set(false);
                    }
                } else {
                    this.loading.set(false);
                    this.errorMsg.set(response.message || 'User not found');
                }
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMsg.set(err.error?.message || 'Failed to load user');
            },
        });
    }

    loadAccountInfo(): void {
        if (!this.userId) return;

        this.userService.getUserAccount(this.userId).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.success && response.data) {
                    // Update user with account info
                    const currentUser = this.user();
                    if (currentUser) {
                        this.user.set({
                            ...currentUser,
                            account: {
                                userId: response.data.userId,
                                email: response.data.email,
                                enabled: response.data.enabled,
                                userStatus: response.data.userStatus,
                            },
                        });
                    }
                } else {
                    // If account info fails, still show user data
                    this.loading.set(false);
                }
            },
            error: (err) => {
                // If account info fails, still show user data
                this.loading.set(false);
                console.warn('Failed to load account info:', err);
            },
        });
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
        return status === 'UNCONFIRMED' || 
               status === 'FORCE_CHANGE_PASSWORD' ||
               (status === 'UNKNOWN' && (!email || email === 'N/A'));
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
            return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return 'N/A';
        }
    }

    formatUserStatus(status: string | null | undefined): string {
        if (!status) return 'N/A';
        const statusMap: Record<string, string> = {
            'CONFIRMED': 'Verified',
            'UNCONFIRMED': 'Unverified',
            'FORCE_CHANGE_PASSWORD': 'Force Change Password',
            'UNKNOWN': 'Unknown',
        };
        return statusMap[status.toUpperCase()] || status;
    }

    toggleAccountStatus(user: User | null): void {
        if (!user || this.loading()) return;

        const isDisabled = this.isUserDisabled();
        const confirmMessage = isDisabled
            ? 'Are you sure you want to enable this account?'
            : 'Are you sure you want to disable this account?';

        if (!confirm(confirmMessage)) {
            return;
        }

        this.loading.set(true);
        const action = isDisabled
            ? this.userService.restoreUser(user.id)
            : this.userService.softDeleteUser(user.id);

        action.subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.success) {
                    this.loadUser();
                } else {
                    this.errorMsg.set(response.message || 'Failed to toggle account status');
                }
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMsg.set(err.error?.message || 'Failed to toggle account status');
            },
        });
    }


    deleteAccount(user: User | null): void {
        if (!user || this.loading()) return;

        if (!confirm('Are you sure you want to permanently delete this account? This action cannot be undone and the user will be permanently removed from the system.')) {
            return;
        }

        this.loading.set(true);
        this.userService.hardDeleteUser(user.id).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.success) {
                    this.router.navigate(['/users']);
                } else {
                    this.errorMsg.set(response.message || 'Failed to delete account');
                }
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMsg.set(err.error?.message || 'Failed to delete account');
            },
        });
    }

    goBack(): void {
        this.router.navigate(['/users']);
    }

    getUserFirstName(): string {
        const u = this.user();
        if (!u) return 'N/A';
        return (u as any).firstName || u.first_name || 'N/A';
    }

    getUserLastName(): string {
        const u = this.user();
        if (!u) return 'N/A';
        return (u as any).lastName || u.last_name || 'N/A';
    }

    getUserBirthDate(): string | null {
        const u = this.user();
        if (!u) return null;
        return (u as any).birthDate || u.birth_date || null;
    }

    isUserDisabled(): boolean {
        const u = this.user();
        if (!u) return false;
        return !!(u as any).deletedAt || !!u.deleted_at;
    }

    getUserRoles(): any[] {
        const u = this.user();
        return (u as any)?.roles || [];
    }

    hasRoles(): boolean {
        const roles = this.getUserRoles();
        return roles.length > 0;
    }
}