import { User } from '../../../features/users/services/user.service';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean; // Flag để biết initAuth đã hoàn thành chưa
  error: string | null;
  accessToken: string | null;
  idToken: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false, // Chưa initialized khi app mới start
  error: null,
  accessToken: null,
  idToken: null
};