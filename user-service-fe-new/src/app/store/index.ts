import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { authReducer } from './auth/reducers/auth.reducer';
import { AuthState } from './auth/state/auth.state';
import { ProfileState } from './auth/state/profile.state';
import { profileReducer } from './auth/reducers/profile.reducer';
import { userReducer } from './user/reducers/user.reducer';
import { UserState } from './user/state/user.state';

export interface AppState {
  auth: AuthState;
  profile: ProfileState;
  user: UserState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  profile: profileReducer,
  user: userReducer,
};

export const metaReducers: MetaReducer<AppState>[] = [];