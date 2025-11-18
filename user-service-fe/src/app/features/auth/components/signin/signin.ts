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
      next: async (response: ApiResponse<AuthResponse>) => {
        if (response.success) {
          this.showSuccess('Welcome back! Sign in successful.');
          
          // Log để kiểm tra token đã được get sau khi signin chưa
          const session = await fetchAuthSession();
          console.log('SESSION TOKENS:', session.tokens);
          
          // Kiểm tra profile và redirect dựa trên kết quả
          this.authService.checkProfileAfterSignIn().subscribe({
            next: (profileResult) => {
              if (profileResult.hasProfile) {
                // User đã có profile → redirect to homepage
                setTimeout(() => {
                  this.router.navigate(['/']);
                }, 1500);
              } else {
                // User chưa có profile → redirect to create profile
                setTimeout(() => {
                  this.router.navigate(['/profile'], { 
                    queryParams: { mode: 'create' } 
                  });
                }, 1500);
              }
              this.isLoading = false;
            },
            error: (error) => {
              console.error('[SignIn] Error checking profile:', error);
              // Nếu lỗi, vẫn redirect về homepage
              setTimeout(() => {
                this.router.navigate(['/']);
              }, 1500);
              this.isLoading = false;
            }
          });
        } else {
          // Nếu không success, check errorName để xử lý đặc biệt
          const errorName = response.errorName || '';
          
          // Check nếu là UserNotConfirmedException → auto redirect đến confirm page
          if (
            errorName === 'UserNotConfirmedException' ||
            response.message?.includes('not confirmed') ||
            response.message?.includes('UserNotConfirmed') ||
            response.message?.includes('not verified')
          ) {
            // Code đã được gửi tự động trong auth.service.ts
            const message = response.message?.includes('has been sent') 
              ? response.message 
              : 'Your account needs to be verified. Redirecting to verification page...';
            this.showError(message);
            setTimeout(() => {
              this.router.navigate(['/confirm-email'], {
                queryParams: { email: email }
              });
            }, 1500);
          } else {
            // Hiển thị error message thông thường
            this.showError(response.message || 'Sign in failed');
          }
          this.isLoading = false;
        }
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
          // Sử dụng message từ error (đã có thông tin về code đã được gửi)
          this.showError(errorMsg.includes('has been sent') 
            ? errorMsg 
            : 'Your account needs to be verified. Redirecting to verification page...');
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
