import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store';
import * as AuthActions from '../../store/auth/actions/auth.action';
import { selectIsLoading } from '../../store/auth/selectors/auth.selectors';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent {
  private store = inject(Store<AppState>);
  private router = inject(Router);
  
  // Selector cho loading state
  loading$: Observable<boolean> = this.store.select(selectIsLoading);

  logout(): void {
    // Chỉ cần dispatch action, Effect sẽ xử lý logout và navigation
    this.store.dispatch(AuthActions.signOut());
  }

  goToUserList(): void {
    this.router.navigate(['/users']);
  }
}