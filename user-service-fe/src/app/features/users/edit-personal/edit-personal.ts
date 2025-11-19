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
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { getUserInitials } from '../utils/user.utils';
import { handleError } from '../utils/error-handler.helper';
import { AppState } from '../../../store';
import { selectSelectedUser, selectUsersLoading } from '../../../store/users/selectors/users.selectors';
import * as UsersActions from '../../../store/users/actions/users.actions';
import { UserService, User, Gender, ApiResponse } from '../services/user.service';

@Component({
  selector: 'app-edit-personal',
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
  templateUrl: './edit-personal.html',
  styleUrl: './edit-personal.css'
})
export class EditPersonalComponent implements OnInit, OnDestroy {
  personalForm: FormGroup;
  loading$!: Observable<boolean>;
  userId: number | null = null;
  currentUser$!: Observable<User | null>;
  private destroy$ = new Subject<void>();

  genders = [
    { value: Gender.MALE, label: 'Male', icon: 'male' },
    { value: Gender.FEMALE, label: 'Female', icon: 'female' },
    { value: Gender.OTHER, label: 'Other', icon: 'transgender' }
  ];

  get fullName(): string {
    const firstName = this.personalForm.get('first_name')?.value || '';
    const lastName = this.personalForm.get('last_name')?.value || '';
    return `${firstName} ${lastName}`.trim() || 'User';
  }

  getInitials(user: User | null): string {
    return getUserInitials(user);
  }

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private store: Store<AppState>
  ) {
    this.personalForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      birth_date: [null],
      gender: [null]
    });
    this.loading$ = this.store.select(selectUsersLoading);
    this.currentUser$ = this.store.select(selectSelectedUser);
  }

  ngOnInit(): void {
    // Lấy user ID từ route params
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.userId = id;
        this.loadUser();
      } else {
        this.snackBar.open('Invalid user ID', 'Close', { duration: 3000 });
        this.router.navigate(['/']);
      }
    });

    // Subscribe to errors
    this.store.select(state => (state as AppState).users.error).pipe(
      takeUntil(this.destroy$),
      filter(error => error !== null)
    ).subscribe(error => {
      this.snackBar.open(error!, 'Close', { duration: 5000 });
    });

    // Subscribe to selected user from store
    this.currentUser$.pipe(
      takeUntil(this.destroy$),
      filter(user => user !== null)
    ).subscribe(user => {
      if (user && user.id === this.userId) {
        // Populate form với dữ liệu từ store
        this.personalForm.patchValue({
          first_name: user.firstName,
          last_name: user.lastName,
          birth_date: user.birthDate ? new Date(user.birthDate) : null,
          gender: user.gender
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(): void {
    if (!this.userId) return;

    // Check if user is already in store and matches current userId
    this.store.select(selectSelectedUser).pipe(
      take(1)
    ).subscribe(selectedUser => {
      if (selectedUser && selectedUser.id === this.userId) {
        // User already loaded in store, no need to reload
        return;
      }
      
      // Dispatch action to load user detail
      this.store.dispatch(UsersActions.loadUserDetail({ userId: this.userId! }));
    });
  }

  onSubmit(): void {
    if (this.personalForm.invalid || !this.userId) {
      return;
    }

    const formValue = this.personalForm.value;
    const updateData = {
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      birth_date: formValue.birth_date ? formValue.birth_date.toISOString().split('T')[0] : undefined,
      gender: formValue.gender || undefined
    };

    this.userService.updateUser(this.userId, updateData).subscribe({
      next: (response: ApiResponse<User>) => {
        if (response.success) {
          this.snackBar.open('Personal information updated successfully', 'Close', { duration: 3000 });
          // Reload user detail in store
          this.store.dispatch(UsersActions.loadUserDetail({ userId: this.userId! }));
          // Redirect về user detail page sau 1.5s
          setTimeout(() => {
            this.router.navigate(['/users', this.userId]);
          }, 1500);
        } else {
          this.snackBar.open(response.message || 'Failed to update', 'Close', { duration: 5000 });
        }
      },
      error: (error) => {
        handleError(error, this.snackBar, 'Failed to update personal information', 'Error updating user:');
      }
    });
  }

  onCancel(): void {
    if (this.userId) {
      this.router.navigate(['/users', this.userId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  get first_name() {
    return this.personalForm.get('first_name');
  }

  get last_name() {
    return this.personalForm.get('last_name');
  }
}