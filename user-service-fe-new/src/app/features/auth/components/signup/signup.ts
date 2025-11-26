import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../store';
import * as AuthActions from '../../../../store/auth/actions/auth.action';
import { 
  selectIsSigningUp, 
  selectSignUpError 
} from '../../../../store/auth/selectors/auth.selectors';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);

  // Selectors
  isSigningUp$: Observable<boolean> = this.store.select(selectIsSigningUp);
  signUpError$: Observable<string | null> = this.store.select(selectSignUpError);

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

    const { email, password } = this.form.value;
    
    // Dispatch action thay vì gọi service trực tiếp
    this.store.dispatch(AuthActions.signUp({ 
      email: email!, 
      password: password! 
    }));
  }
}
