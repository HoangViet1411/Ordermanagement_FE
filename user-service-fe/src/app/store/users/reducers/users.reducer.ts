import { createReducer, on } from '@ngrx/store';
import { initialUsersState, UsersState } from '../state/users.state';
import * as UsersActions from '../actions/users.actions';

export const usersReducer = createReducer(
  initialUsersState,
  
  // Load Users
  on(UsersActions.loadUsers, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  
  on(UsersActions.loadUsersSuccess, (state, { users, pagination }) => ({
    ...state,
    users,
    pagination,
    isLoading: false,
    error: null
  })),
  
  on(UsersActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  
  // Load User Detail
  on(UsersActions.loadUserDetail, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  
  on(UsersActions.loadUserDetailSuccess, (state, { user }) => ({
    ...state,
    selectedUser: user,
    isLoading: false,
    error: null
  })),
  
  on(UsersActions.loadUserDetailFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  
  // Clear Selected User
  on(UsersActions.clearSelectedUser, (state) => ({
    ...state,
    selectedUser: null
  })),
  
  // Clear Error
  on(UsersActions.clearUsersError, (state) => ({
    ...state,
    error: null
  }))
);

// Export UsersState để dùng trong index.ts
export type { UsersState };

