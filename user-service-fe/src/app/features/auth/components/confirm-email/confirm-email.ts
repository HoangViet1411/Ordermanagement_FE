import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { AuthService, ApiResponse } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-confirm-email',
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
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.css'
})
export class ConfirmEmailComponent implements OnInit {
  confirmForm: FormGroup;
  isLoading = false;
  email: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.confirmForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Lấy email từ query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        // Nếu không có email, redirect về signup
        this.showError('Email is required. Please sign up again.');
        setTimeout(() => {
          this.router.navigate(['/signup']);
        }, 2000);
      }
    });
  }

  onSubmit(): void {
    if (this.confirmForm.invalid || !this.email) {
      return;
    }

    this.isLoading = true;
    const { code } = this.confirmForm.value;

    this.authService.confirmSignUp(this.email, code).subscribe({
      next: (response: ApiResponse<void>) => {
        if (response.success) {
          this.showSuccess('Email confirmed successfully! Redirecting to sign in...');
          setTimeout(() => {
            this.router.navigate(['/signin']);
          }, 1500);
        } else {
          this.showError(response.message || 'Confirmation failed');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        const errorMessage = error.error?.message || 'An error occurred during confirmation';
        this.showError(errorMessage);
        this.isLoading = false;
      }
    });
  }

  onResendCode(): void {
    if (!this.email) {
      this.showError('Email is required');
      return;
    }

    this.isLoading = true;
    this.authService.resendConfirmationCode(this.email).subscribe({
      next: (response: ApiResponse<void>) => {
        if (response.success) {
          this.showSuccess(response.message || 'Confirmation code sent successfully');
        } else {
          this.showError(response.message || 'Failed to resend confirmation code');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        const errorMessage = error.error?.message || 'An error occurred while resending code';
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

  get code() {
    return this.confirmForm.get('code');
  }
}

