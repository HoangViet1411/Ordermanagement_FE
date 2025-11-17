import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Material Modules (giống signin)
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { AuthService, ApiResponse, SignUpResponse } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
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
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class SignUpComponent {
  signUpForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // KHÁC BIỆT: Password phải min 8 characters
    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]] // Thêm confirm password
    }, { 
      validators: this.passwordMatchValidator // Custom validator
    });
  }

  // KHÁC BIỆT: Custom validator để check password match
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.signUpForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.signUpForm.value;

    // KHÁC BIỆT: Gọi signUp thay vì signIn
    this.authService.signUp({ email, password }).subscribe({
      next: (response: ApiResponse<SignUpResponse>) => {
        if (response.success) {
          // Nếu cần confirm, redirect đến trang confirm
          if (response.data?.needsConfirmation) {
            this.showSuccess('Account created! Please check your email for confirmation code.');
            setTimeout(() => {
              this.router.navigate(['/confirm-email'], { 
                queryParams: { email: email } 
              });
            }, 1500);
          } else {
            // Nếu không cần confirm, redirect đến sign in
            this.showSuccess('Account created successfully! Redirecting to sign in...');
            setTimeout(() => {
              this.router.navigate(['/signin']);
            }, 1500);
          }
        } else {
          this.showError(response.message || 'Sign up failed');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        const errorMessage = error.error?.message || 'An error occurred during sign up';
        this.showError(errorMessage);
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
    return this.signUpForm.get('email');
  }

  get password() {
    return this.signUpForm.get('password');
  }

  get confirmPassword() {
    return this.signUpForm.get('confirmPassword');
  }
}