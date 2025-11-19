import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, take, filter, switchMap } from 'rxjs/operators';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { AppState } from '../../../../store';
import * as AuthActions from '../../../../store/auth/actions/auth.actions';
import { selectIsLoading, selectAuthError, selectCurrentUser, selectIsAuthenticated } from '../../../../store/auth/selectors/auth.selectors';
import { fetchAuthSession } from 'aws-amplify/auth';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.css'
})
export class SignInComponent implements OnInit, OnDestroy {
  signInForm: FormGroup;
  isLoading$: Observable<boolean>;
  hidePassword = true;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
    
    this.isLoading$ = this.store.select(selectIsLoading);
  }

  ngOnInit(): void {
    // Subscribe to auth error
    this.store.select(selectAuthError)
      .pipe(
        takeUntil(this.destroy$),
        filter(error => error !== null)
      )
      .subscribe(error => {
        this.handleAuthError(error!);
      });

    // Subscribe to authentication success
    this.store.select(selectIsAuthenticated)
      .pipe(
        takeUntil(this.destroy$),
        filter(isAuthenticated => isAuthenticated === true),
        take(1) // Chỉ show message một lần sau khi signin thành công
      )
      .subscribe(() => {
        this.handleSignInSuccess();
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.signInForm.invalid) {
      return;
    }

    const { email, password } = this.signInForm.value;
    
    // Clear any previous errors
    this.store.dispatch(AuthActions.clearAuthError());
    
    // Dispatch sign in action
    this.store.dispatch(AuthActions.signIn({ email, password }));
  }

  private async handleSignInSuccess(): Promise<void> {
    this.showSuccess('Welcome back! Sign in successful.');
    
    // Log để kiểm tra token đã được get sau khi signin chưa
    const session = await fetchAuthSession();
    console.log('SESSION TOKENS:', session.tokens);
    
    // Profile sẽ được load tự động bởi effect, đợi user được load
  }

  private handleAuthError(error: string): void {
    const email = this.signInForm.get('email')?.value || '';
    
    // Extract errorName from error message if present (format: [ErrorName] message)
    const errorNameMatch = error.match(/^\[([^\]]+)\]/);
    const errorName = errorNameMatch ? errorNameMatch[1] : '';
    const errorMessage = errorNameMatch ? error.replace(/^\[[^\]]+\]\s*/, '') : error;
    
    // Check nếu là UserNotConfirmedException → auto redirect đến confirm page
    if (
      errorName === 'UserNotConfirmedException' ||
      error.includes('not confirmed') ||
      error.includes('UserNotConfirmed') ||
      error.includes('not verified')
    ) {
      const message = error.includes('has been sent') 
        ? errorMessage 
        : 'Your account needs to be verified. Redirecting to verification page...';
      this.showError(message);
      setTimeout(() => {
        this.router.navigate(['/confirm-email'], {
          queryParams: { email: email }
        });
      }, 1500);
    } else {
      // Hiển thị error message thông thường (without errorName prefix)
      this.showError(errorMessage);
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, '✓', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  get email() {
    return this.signInForm.get('email');
  }

  get password() {
    return this.signInForm.get('password');
  }

  
}
