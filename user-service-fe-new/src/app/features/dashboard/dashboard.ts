import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);

  logout(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.auth.signOutAll().subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/signin');
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Vẫn clear user và redirect dù có lỗi
        this.auth.clearCurrentUser();
        this.loading.set(false);
        this.router.navigateByUrl('/signin');
      },
    });
  }
}
