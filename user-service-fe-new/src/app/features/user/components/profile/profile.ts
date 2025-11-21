import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, ProfileData } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private auth = inject(AuthService);

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  isEditMode = signal(false);

  form = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    birth_date: [''],
    gender: [''],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    // Chỉ dùng cache từ localStorage
    const cachedProfile = this.auth.getProfileFromStorage();
    if (cachedProfile && cachedProfile.success && cachedProfile.data) {
      // Có cache → load vào form
          this.form.patchValue({
        first_name: cachedProfile.data.firstName || cachedProfile.data.first_name || '',
        last_name: cachedProfile.data.LastName || cachedProfile.data.lastName || cachedProfile.data.last_name || '',
        birth_date: cachedProfile.data.birthDate ? cachedProfile.data.birthDate.split('T')[0] : '',
        gender: cachedProfile.data.gender || '',
          });
          this.isEditMode.set(true);
        } else {
      // Không có cache → form trống, chờ user tạo profile
          this.isEditMode.set(false);
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

    const data: ProfileData = {
      first_name: this.form.value.first_name!,
      last_name: this.form.value.last_name!,
      birth_date: this.form.value.birth_date || undefined,
      gender: this.form.value.gender as any || undefined,
    };

    this.userService.createOrUpdateProfile(data).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          // Lưu profile vào localStorage sau khi create/update thành công
          this.auth.markProfileCreated(response);
          // this.loadProfile();
          // Hoặc navigate đến dashboard
          this.router.navigateByUrl('/dashboard');
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.error?.errors) {
          // Validation errors từ backend
          this.errorMsg.set(err.error.message || 'Validation error');
        } else {
          this.errorMsg.set('Không thể lưu profile. Thử lại sau.');
        }
      },
    });
  }
}