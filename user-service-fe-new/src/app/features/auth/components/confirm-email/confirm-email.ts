import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './confirm-email.html',
  styleUrls: ['./confirm-email.css'],
})
export class ConfirmEmailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  email = signal<string>('');

  form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit(): void {
    // Cho phép cả history.state và query params (ưu tiên state)
    const state = history.state as { email?: string } | null;
    const emailFromQuery = this.route.snapshot.queryParams['email'];
    
    const email = state?.email || emailFromQuery;
    
    if (email) {
      this.email.set(email);
    } else {
      // Không có email → redirect về signup
      this.router.navigateByUrl('/signup');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set(null);

    const code = this.form.value.code!;

    this.auth.confirmSignUp(this.email(), code).subscribe({
      next: () => {
        this.loading.set(false);
        // Xác nhận thành công → điều hướng đến signin
        this.router.navigateByUrl('/signin');
      },
      error: (err) => {
        this.loading.set(false);

        const code = err?.name || err?.code;
        if (code === 'UserNotFoundException' || code === 'AliasExistsException') {
          // Email chưa được đăng ký → hiển thị message và redirect về signup
          this.errorMsg.set('Email này chưa được đăng ký. Đang chuyển đến trang đăng ký...');
          setTimeout(() => {
            this.router.navigateByUrl('/signup');
          }, 2000);
        } else if (code === 'CodeMismatchException') {
          this.errorMsg.set('Mã xác nhận không đúng.');
        } else if (code === 'ExpiredCodeException') {
          this.errorMsg.set('Mã xác nhận đã hết hạn. Vui lòng gửi lại mã mới.');
        } else {
          this.errorMsg.set('Xác nhận thất bại. Thử lại sau.');
        }
      },
    });
  }

  resendCode(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set(null);

    this.auth.resendCode(this.email()).subscribe({
      next: () => {
        this.loading.set(false);
        // Có thể hiển thị message thành công
        alert('Mã xác nhận mới đã được gửi đến email của bạn.');
      },
      error: (err) => {
        this.loading.set(false);
        
        const code = err?.name || err?.code;
        if (code === 'UserNotFoundException' || code === 'AliasExistsException') {
          // Email chưa được đăng ký → redirect về signup
          this.errorMsg.set('Email này chưa được đăng ký. Đang chuyển đến trang đăng ký...');
          setTimeout(() => {
            this.router.navigateByUrl('/signup');
          }, 2000);
        } else {
          this.errorMsg.set('Không thể gửi lại mã. Thử lại sau.');
        }
      },
    });
  }
}