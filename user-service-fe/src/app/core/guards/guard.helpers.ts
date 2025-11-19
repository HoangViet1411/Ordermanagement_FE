import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { AppState } from '../../store';
import { selectCurrentUser, selectIsLoading } from '../../store/auth/selectors/auth.selectors';

/**
 * Helper function để đợi profile load xong từ store
 * Profile đã được load tự động bởi:
 * - initAuthSuccess effect (khi app khởi động)
 * - Amplify Hub signedIn event (khi user sign in)
 * - Global effect checkProfileOnNavigation$ (khi navigate)
 * 
 * Guards chỉ cần đợi profile load xong để check logic, không cần dispatch nữa
 * Trả về Observable<User | null>
 */
export function checkAndLoadProfile(
  store: Store<AppState>
): Observable<any> {
  // Đợi profile load xong từ store (cả khi user = null)
  // Profile đã được load tự động bởi effects, chỉ cần đợi thôi
  return combineLatest([
    store.select(selectCurrentUser),
    store.select(selectIsLoading)
  ]).pipe(
    filter(([user, isLoading]) => !isLoading), // Đợi đến khi không còn loading
    take(1),
    map(([user, isLoading]) => user) // Trả về user (có thể là null)
  );
}
