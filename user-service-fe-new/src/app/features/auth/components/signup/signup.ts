import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    return password.value === confirmPassword.value 
      ? null 
      : { passwordMismatch: true };
  }

  submit(): void {
    // 1. Chặn submit khi form invalid
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // 2. Chặn double-submit khi đang loading
    if (this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set(null);

    const { email, password } = this.form.value;

    this.auth.signUp({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
        // Điều hướng đến trang confirm email
        this.router.navigateByUrl('/confirm-email', { 
          state: { email } 
        });
      },
      error: (err) => {
        this.loading.set(false);

        // Map lỗi Cognito
        const code = err?.name || err?.code;
        if (code === 'UsernameExistsException') {
          this.errorMsg.set('Email này đã được sử dụng.');
        } else if (code === 'InvalidPasswordException') {
          this.errorMsg.set('Mật khẩu không đáp ứng yêu cầu.');
        } else if (code === 'InvalidParameterException') {
          this.errorMsg.set('Thông tin không hợp lệ.');
        } else {
          this.errorMsg.set('Đăng ký thất bại. Thử lại sau.');
        }
      },
    });
  }
}
