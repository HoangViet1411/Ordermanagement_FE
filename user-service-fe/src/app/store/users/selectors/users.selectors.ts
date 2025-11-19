import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UsersState } from '../state/users.state';

export const selectUsersState = createFeatureSelector<UsersState>('users');

export const selectUsers = createSelector(
  selectUsersState,
  (state: UsersState) => state.users
);

export const selectSelectedUser = createSelector(
  selectUsersState,
  (state: UsersState) => state.selectedUser
);

export const selectUsersLoading = createSelector(
  selectUsersState,
  (state: UsersState) => state.isLoading
);

export const selectUsersError = createSelector(
  selectUsersState,
  (state: UsersState) => state.error
);

export const selectUsersPagination = createSelector(
  selectUsersState,
  (state: UsersState) => state.pagination
);

