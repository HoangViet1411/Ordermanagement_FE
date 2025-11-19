import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, take, filter, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { AppState } from '../../../store';
import { selectCurrentUser, selectIsLoading } from '../../../store/auth/selectors/auth.selectors';
import * as AuthActions from '../../../store/auth/actions/auth.actions';
import { Gender } from '../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  loading$!: Observable<boolean>;
  isEditMode = false;
  currentUser$!: Observable<any>;
  private destroy$ = new Subject<void>();
  private hasSubmitted = false;

  genders = [
    { value: Gender.MALE, label: 'Male', icon: 'male' },
    { value: Gender.FEMALE, label: 'Female', icon: 'female' },
    { value: Gender.OTHER, label: 'Other', icon: 'transgender' }
  ];

  get fullName(): string {
    const firstName = this.profileForm.get('first_name')?.value || '';
    const lastName = this.profileForm.get('last_name')?.value || '';
    return `${firstName} ${lastName}`.trim() || 'Your Name';
  }

  get initials(): string {
    const firstName = this.profileForm.get('first_name')?.value || '';
    const lastName = this.profileForm.get('last_name')?.value || '';
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return first && last ? `${first}${last}` : first || last || '?';
  }

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    public router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      birth_date: [null],
      gender: [null]
    });
    this.loading$ = this.store.select(selectIsLoading);
    this.currentUser$ = this.store.select(selectCurrentUser);
  }

  ngOnInit(): void {
    // Check if edit mode from query params
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.isEditMode = params['mode'] === 'edit';
    });

    // Đợi initAuth hoàn thành trước khi load profile
    this.store.select(state => (state as AppState).auth.isInitialized).pipe(
      filter(isInitialized => isInitialized === true),
      take(1),
      switchMap(() => combineLatest([
        this.currentUser$,
        this.store.select(state => (state as AppState).auth.isAuthenticated)
      ]).pipe(take(1)))
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([user, isAuthenticated]) => {
      if (user) {
        this.isEditMode = true;
        // Populate form with existing data
        this.profileForm.patchValue({
          first_name: user.firstName,
          last_name: user.lastName,
          birth_date: user.birthDate ? new Date(user.birthDate) : null,
          gender: user.gender
        });
      } else if (isAuthenticated) {
        // Profile sẽ được load tự động bởi global effect
        this.store.dispatch(AuthActions.loadProfileIfNeeded());
      } else {
        this.isEditMode = false;
      }
    });

    // Listen for user updates after initial load
    this.currentUser$.pipe(
      takeUntil(this.destroy$),
      filter(user => user !== null),
      distinctUntilChanged((prev, curr) => prev?.id === curr?.id)
    ).subscribe(user => {
      if (user && !this.hasSubmitted) {
        // Only populate form if we haven't submitted (initial load)
        this.isEditMode = true;
        this.profileForm.patchValue({
          first_name: user.firstName,
          last_name: user.lastName,
          birth_date: user.birthDate ? new Date(user.birthDate) : null,
          gender: user.gender
        });
      }
    });

    // Listen for update profile success/failure
    combineLatest([
      this.store.select(state => (state as AppState).auth.error),
      this.store.select(state => (state as AppState).auth.isLoading),
      this.currentUser$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([error, isLoading, user]) => ({ error, isLoading, user }))
    ).subscribe(auth => {
      // Show error if there's an error and we're not loading
      if (auth.error && !auth.isLoading && this.hasSubmitted) {
        this.snackBar.open(auth.error, 'Close', { duration: 5000 });
        this.hasSubmitted = false;
      }
      
      // Show success message if we just submitted and update was successful
      if (this.hasSubmitted && auth.user && !auth.isLoading && !auth.error) {
        this.snackBar.open(
          this.isEditMode ? 'Profile updated successfully' : 'Profile created successfully',
          'Close',
          { duration: 3000 }
        );
        this.hasSubmitted = false;
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.hasSubmitted = true;
    const formValue = this.profileForm.value;
    const profileData = {
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      birth_date: formValue.birth_date ? formValue.birth_date.toISOString().split('T')[0] : undefined,
      gender: formValue.gender ? (formValue.gender as Gender) : undefined
    };

    this.store.dispatch(AuthActions.updateProfile({ profileData }));
  }

  get first_name() {
    return this.profileForm.get('first_name');
  }

  get last_name() {
    return this.profileForm.get('last_name');
  }

  getGenderLabel = (value: string | null): string => {
    if (!value) return 'Not specified';
    const gender = this.genders.find(g => g.value === value);
    return gender ? gender.label : value;
  };
}

