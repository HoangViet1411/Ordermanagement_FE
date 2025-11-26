import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppState } from '../../../../store';
import * as AuthActions from '../../../../store/auth/actions/auth.action';
import { 
  selectIsConfirmingEmail,
  selectIsResendingCode,
  selectConfirmEmailError,
  selectResendCodeError
} from '../../../../store/auth/selectors/auth.selectors';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './confirm-email.html',
  styleUrls: ['./confirm-email.css'],
})
export class ConfirmEmailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Email từ route state hoặc query params (giữ lại signal vì không liên quan đến Store)
  email = signal<string>('');

  // Selectors
  isConfirmingEmail$: Observable<boolean> = this.store.select(selectIsConfirmingEmail);
  isResendingCode$: Observable<boolean> = this.store.select(selectIsResendingCode);
  confirmEmailError$: Observable<string | null> = this.store.select(selectConfirmEmailError);
  resendCodeError$: Observable<string | null> = this.store.select(selectResendCodeError);

  // Combined loading state (đang confirm hoặc đang resend)
  loading$: Observable<boolean> = combineLatest([
    this.isConfirmingEmail$,
    this.isResendingCode$
  ]).pipe(
    map(([isConfirming, isResending]) => isConfirming || isResending)
  );

  // Combined error (ưu tiên confirm error, nếu không có thì dùng resend error)
  errorMsg$: Observable<string | null> = combineLatest([
    this.confirmEmailError$,
    this.resendCodeError$
  ]).pipe(
    map(([confirmError, resendError]) => confirmError || resendError)
  );

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

    const code = this.form.value.code!;
    const email = this.email();

    // Dispatch action thay vì gọi service trực tiếp
    this.store.dispatch(AuthActions.confirmEmail({ 
      email, 
      code 
    }));
  }

  resendCode(): void {
    const email = this.email();
    
    // Dispatch action thay vì gọi service trực tiếp
    this.store.dispatch(AuthActions.resendCode({ email }));
  }
}