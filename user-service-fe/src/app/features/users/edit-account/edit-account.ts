import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { getUserInitials } from '../utils/user.utils';
import { handleError } from '../utils/error-handler.helper';
import { AppState } from '../../../store';
import { selectSelectedUser, selectUsersLoading } from '../../../store/users/selectors/users.selectors';
import * as UsersActions from '../../../store/users/actions/users.actions';
import { UserService, User, ApiResponse } from '../services/user.service';

@Component({
  selector: 'app-edit-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './edit-account.html',
  styleUrl: './edit-account.css'
})
export class EditAccountComponent implements OnInit, OnDestroy {
  emailForm: FormGroup;
  loading$!: Observable<boolean>;
  userId: number | null = null;
  currentUser$!: Observable<User | null>;
  currentEmail: string = '';
  private destroy$ = new Subject<void>();

  getInitials(user: User | null): string {
    return getUserInitials(user);
  }

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private store: Store<AppState>
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.loading$ = this.store.select(selectUsersLoading);
    this.currentUser$ = this.store.select(selectSelectedUser);
  }

  ngOnInit(): void {
    // Lấy user ID từ route params
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.userId = id;
        this.loadUser();
      } else {
        this.snackBar.open('Invalid user ID', 'Close', { duration: 3000 });
        this.router.navigate(['/']);
      }
    });

    // Subscribe to errors
    this.store.select(state => (state as AppState).users.error).pipe(
      takeUntil(this.destroy$),
      filter(error => error !== null)
    ).subscribe(error => {
      this.snackBar.open(error!, 'Close', { duration: 5000 });
    });

    // Subscribe to selected user from store
    this.currentUser$.pipe(
      takeUntil(this.destroy$),
      filter(user => user !== null)
    ).subscribe(user => {
      if (user && user.id === this.userId) {
        this.currentEmail = user.account?.email || '';
        // Populate form với email hiện tại
        this.emailForm.patchValue({
          email: this.currentEmail
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  onSubmit(): void {
    if (this.emailForm.invalid || !this.userId) {
      return;
    }

    const newEmail = this.emailForm.get('email')?.value?.trim();
    
    // Check nếu email không thay đổi
    if (newEmail === this.currentEmail) {
      this.snackBar.open('Email has not changed', 'Close', { duration: 3000 });
      return;
    }
    
    this.userService.updateEmail(this.userId, newEmail).subscribe({
      next: (response: ApiResponse<{ message: string }>) => {
        if (response.success) {
          this.snackBar.open('Email updated successfully', 'Close', { duration: 3000 });
          // Reload user detail in store
          this.store.dispatch(UsersActions.loadUserDetail({ userId: this.userId! }));
          // Redirect về user detail page sau 1.5s
          setTimeout(() => {
            this.router.navigate(['/users', this.userId]);
          }, 1500);
        } else {
          this.snackBar.open(response.message || 'Failed to update email', 'Close', { duration: 5000 });
        }
      },
      error: (error) => {
        handleError(error, this.snackBar, 'Failed to update email', 'Error updating email:');
      }
    });
  }

  onCancel(): void {
    if (this.userId) {
      this.router.navigate(['/users', this.userId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  get email() {
    return this.emailForm.get('email');
  }
}

