import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css'
})
export class HomepageComponent {
  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

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