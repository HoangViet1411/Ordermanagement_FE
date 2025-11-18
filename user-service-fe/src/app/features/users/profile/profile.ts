import { Component, OnInit } from '@angular/core';
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
import { UserService, User, Gender } from '../services/user.service';

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
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  isEditMode = false;
  currentUser: User | null = null;

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
    private userService: UserService,
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
  }

  ngOnInit(): void {
    // Check if edit mode from query params
    this.route.queryParams.subscribe(params => {
      this.isEditMode = params['mode'] === 'edit';
    });

    // Load current profile if exists
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.userService.getCurrentProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentUser = response.data;
          this.isEditMode = true;
          // Populate form with existing data
          this.profileForm.patchValue({
            first_name: response.data.firstName,
            last_name: response.data.lastName,
            birth_date: response.data.birthDate ? new Date(response.data.birthDate) : null,
            gender: response.data.gender
          });
        } else {
          // No profile exists, create mode
          this.isEditMode = false;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.profileForm.value;
    const profileData = {
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      birth_date: formValue.birth_date ? formValue.birth_date.toISOString().split('T')[0] : undefined,
      gender: formValue.gender || undefined
    };

    this.userService.createOrUpdateProfile(profileData).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(
            this.isEditMode ? 'Profile updated successfully' : 'Profile created successfully',
            'Close',
            { duration: 3000 }
          );
          // Redirect to homepage after 1.5s
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1500);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error saving profile:', error);
        const errorMsg = error?.error?.message || 'Failed to save profile';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
        this.loading = false;
      }
    });
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

