import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { AppState } from '../../store';
import { selectCurrentUser, selectIsAuthenticated } from '../../store/auth/selectors/auth.selectors';
import * as AuthActions from '../../store/auth/actions/auth.actions';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css'
})
export class HomepageComponent implements OnInit, OnDestroy {
  currentUser$!: Observable<any>;
  isAuthenticated$!: Observable<boolean>;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
  }

  ngOnInit(): void {
    // Profile được load tự động bởi global effect
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  viewProfile(): void {
    this.currentUser$.pipe(
      take(1),
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user?.id) {
        this.router.navigate(['/users', user.id]);
      }
    });
  }

  onLogout(): void {
    this.store.dispatch(AuthActions.signOut());
    // Success message will be handled by effect (redirect to signin)
    this.snackBar.open('Logged out successfully!', '✓', {
      duration: 1500,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$;
  }
}