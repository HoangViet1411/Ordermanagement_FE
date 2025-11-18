import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '../../features/users/services/user.service';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css'
})
export class HomepageComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load current user profile to get user ID
    const cachedProfile = this.authService.getCachedProfile();
    if (cachedProfile) {
      this.currentUser = cachedProfile;
    } else {
      this.authService.loadUserProfile().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.currentUser = response.data;
          }
        },
        error: (error) => {
          console.warn('[Homepage] Failed to load user profile:', error);
        }
      });
    }
  }

  viewProfile(): void {
    if (this.currentUser?.id) {
      this.router.navigate(['/users', this.currentUser.id]);
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Logged out successfully!', '✓', {
            duration: 1500,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      },
      error: (error) => {
        this.snackBar.open('Logout failed. Please try again.', '✕', {
          duration: 2500,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}