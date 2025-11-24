import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signin.html',
  styleUrls: ['./signin.css'], 
})
export class SigninComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

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

    this.auth.signIn({ email: email!, password: password! }).subscribe({
      next: (response) => {
        // Check xem user có cần confirm email không
        // AWS Amplify có thể trả về nextStep trong response
        if (response?.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          this.loading.set(false);
          // User chưa confirm → điều hướng đến confirm email
          const email = this.form.value.email!;
          this.router.navigateByUrl('/confirm-email', { 
            state: { email } 
          });
          return;
        }
        
        // Sign in thành công → Hub.listen sẽ xử lý getCurrentUser() và navigate
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);

        // Map lỗi Cognito
        const code = err?.name || err?.code;
        if (code === 'NotAuthorizedException') {
          this.errorMsg.set('Email hoặc mật khẩu không đúng.');
        } else if (code === 'UserNotFoundException') {
          this.errorMsg.set('Không tìm thấy tài khoản.');
        } else {
          this.errorMsg.set('Đăng nhập thất bại. Thử lại sau.');
        }
      },
    });
  }
}
