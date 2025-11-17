import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { AuthService, ApiResponse, AuthResponse } from '../../../../core/services/auth.service';

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
export class SignInComponent {
  signInForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.signInForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.signInForm.value;

    this.authService.signIn({ email, password }).subscribe({
      next: (response: ApiResponse<AuthResponse>) => {
        if (response.success) {
          this.showSuccess('Welcome back! Sign in successful.');
          // Delay redirect để user thấy thông báo
          setTimeout(() => {
            this.router.navigate(['/']); // Redirect to homepage
          }, 1500);
        } else {
          // Check nếu là UserNotConfirmedException → auto redirect đến verify page
          if (response.errorName === 'UserNotConfirmedException' || 
              response.message?.includes('not confirmed') ||
              response.message?.includes('not verified')) {
            this.showError('Your account needs to be verified. Redirecting to verification page...');
            setTimeout(() => {
              this.router.navigate(['/confirm-email'], {
                queryParams: { email: email }
              });
            }, 1500);
          } else {
            this.showError(response.message || 'Sign in failed');
          }
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        // Handle error từ HTTP hoặc các error khác
        const errorName = error?.name || error?.error?.name;
        const errorMsg = error?.message || error?.error?.message || 'An error occurred during sign in';
        
        // Check nếu là UserNotConfirmedException → auto redirect
        if (
          errorName === 'UserNotConfirmedException' ||
          errorMsg.includes('not confirmed') ||
          errorMsg.includes('UserNotConfirmed') ||
          errorMsg.includes('not verified')
        ) {
          // Code đã được gửi tự động trong auth.service.ts
          // Nếu message có "has been sent", hiển thị message đó
          if (errorMsg.includes('has been sent')) {
            this.showError('A confirmation code has been sent to your email. Redirecting to verification page...');
          } else {
            this.showError('Your account needs to be verified. Redirecting to verification page...');
          }
          setTimeout(() => {
            this.router.navigate(['/confirm-email'], {
              queryParams: { email: email }
            });
          }, 1500);
        } else {
          this.showError(errorMsg);
        }
        this.isLoading = false;
      }
    });
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
