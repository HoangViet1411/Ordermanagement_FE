import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../store';
import * as AuthActions from '../../../../store/auth/actions/auth.action';
import { 
  selectIsSigningIn, 
  selectSignInError 
} from '../../../../store/auth/selectors/auth.selectors';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signin.html',
  styleUrls: ['./signin.css'], 
})
export class SigninComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);

  // Selectors
  isSigningIn$: Observable<boolean> = this.store.select(selectIsSigningIn);
  signInError$: Observable<string | null> = this.store.select(selectSignInError);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;
    
    // Dispatch action thay vì gọi service trực tiếp
    this.store.dispatch(AuthActions.signIn({ 
      email: email!, 
      password: password! 
    }));
  }
}