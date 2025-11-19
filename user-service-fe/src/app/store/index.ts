import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { authReducer } from './auth/reducers/auth.reducer';
import { AuthState } from './auth/state/auth.state';
import { usersReducer } from './users/reducers/users.reducer';
import { UsersState } from './users/state/users.state';

export interface AppState {
  auth: AuthState;
  users: UsersState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  users: usersReducer
};

export const metaReducers: MetaReducer<AppState>[] = [];