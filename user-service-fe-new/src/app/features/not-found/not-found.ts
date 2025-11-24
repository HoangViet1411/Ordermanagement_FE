import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.css'],
})
export class NotFoundComponent {
  private router = inject(Router);

  goHome(): void {
    this.router.navigateByUrl('/dashboard');
  }
}

