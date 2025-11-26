import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from '../state/user.state';

export const selectUserState = createFeatureSelector<UserState>('user');

// Basic selectors
export const selectUsers = createSelector(
  selectUserState,
  (state: UserState) => state.users
);

export const selectPagination = createSelector(
  selectUserState,
  (state: UserState) => state.pagination
);

export const selectUserCurrentParams = createSelector(
  selectUserState,
  (state: UserState) => state.currentParams
);

// Loading selectors
export const selectIsLoading = createSelector(
  selectUserState,
  (state: UserState) => state.isLoading
);

export const selectIsTogglingStatus = createSelector(
  selectUserState,
  (state: UserState) => state.isTogglingStatus
);

export const selectIsDeleting = createSelector(
  selectUserState,
  (state: UserState) => state.isDeleting
);

// Error selector
export const selectUserError = createSelector(
  selectUserState,
  (state: UserState) => state.error
);

// User detail selectors
export const selectSelectedUser = createSelector(
  selectUserState,
  (state: UserState) => state.selectedUser
);

export const selectIsLoadingDetail = createSelector(
  selectUserState,
  (state: UserState) => state.isLoadingDetail
);

export const selectUserDetailError = createSelector(
  selectUserState,
  (state: UserState) => state.errorDetail
);
