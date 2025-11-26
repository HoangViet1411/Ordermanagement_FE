import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../store';
import * as ProfileActions from '../../../../store/auth/actions/profile.action';
import { 
  selectProfile,
  selectIsEditMode,
  selectIsSaving,
  selectProfileError
} from '../../../../store/auth/selectors/profile.selector';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);

  // Selectors
  profile$: Observable<any> = this.store.select(selectProfile);
  isEditMode$: Observable<boolean> = this.store.select(selectIsEditMode);
  isSaving$: Observable<boolean> = this.store.select(selectIsSaving);
  errorMsg$: Observable<string | null> = this.store.select(selectProfileError);

  form = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    birth_date: [''],
    gender: [''],
  });

  ngOnInit(): void {
    // Dispatch load profile action
    this.store.dispatch(ProfileActions.loadProfile());
    
    // Subscribe để load profile vào form khi có data
    this.profile$.subscribe(profile => {
      if (profile && profile.success && profile.data) {
        this.form.patchValue({
          first_name: profile.data.firstName || profile.data.first_name || '',
          last_name: profile.data.lastName || profile.data.last_name || '',
          birth_date: profile.data.birthDate ? profile.data.birthDate.split('T')[0] : '',
          gender: profile.data.gender || '',
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const profileData = {
      first_name: this.form.value.first_name!,
      last_name: this.form.value.last_name!,
      birth_date: this.form.value.birth_date || undefined,
      gender: this.form.value.gender as any || undefined,
    };

    // Dispatch action thay vì gọi service trực tiếp
    this.store.dispatch(ProfileActions.createOrUpdateProfile({ profileData }));
  }
}