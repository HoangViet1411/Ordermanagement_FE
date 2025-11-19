import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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

// Custom validator để check password match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (!password || !confirmPassword) {
    return null;
  }
  
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-edit-password',
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
  templateUrl: './edit-password.html',
  styleUrl: './edit-password.css'
})
export class EditPasswordComponent implements OnInit, OnDestroy {
  passwordForm: FormGroup;
  loading$!: Observable<boolean>;
  userId: number | null = null;
  currentUser$!: Observable<User | null>;
  hidePassword = true;
  hideConfirmPassword = true;
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
    this.passwordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
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
    if (this.passwordForm.invalid || !this.userId) {
      return;
    }

    const password = this.passwordForm.get('password')?.value;
    
    this.userService.setPassword(this.userId, password).subscribe({
      next: (response: ApiResponse<{ message: string }>) => {
        if (response.success) {
          this.snackBar.open('Password updated successfully', 'Close', { duration: 3000 });
          // Reset form
          this.passwordForm.reset();
          // Redirect về user detail page sau 1.5s
          setTimeout(() => {
            this.router.navigate(['/users', this.userId]);
          }, 1500);
        } else {
          this.snackBar.open(response.message || 'Failed to update password', 'Close', { duration: 5000 });
        }
      },
      error: (error) => {
        handleError(error, this.snackBar, 'Failed to update password', 'Error updating password:');
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

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  get password() {
    return this.passwordForm.get('password');
  }

  get confirmPassword() {
    return this.passwordForm.get('confirmPassword');
  }

  getPasswordErrorMessage(): string {
    if (this.password?.hasError('required')) {
      return 'Password is required';
    }
    if (this.password?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    if (this.password?.hasError('pattern')) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    if (this.confirmPassword?.hasError('required')) {
      return 'Please confirm your password';
    }
    if (this.passwordForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }
}

