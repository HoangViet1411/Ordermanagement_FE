import { createReducer, on } from '@ngrx/store';
import { initialUserState, UserState } from '../state/user.state';
import * as UserActions from '../actions/user.action';

export const userReducer = createReducer(
  initialUserState,

  // ========== Load Users ==========
  on(UserActions.loadUsers, (state, { params }) => ({
    ...state,
    isLoading: true,
    error: null,
    currentParams: {
      ...state.currentParams,
      ...(params && {
        page: params.page ?? state.currentParams.page,
        limit: params.limit ?? state.currentParams.limit,
        includeAccount: params.includeAccount ?? state.currentParams.includeAccount,
        include_deleted: params.include_deleted ?? state.currentParams.include_deleted,
      }),
    },
  })),

  on(UserActions.loadUsersSuccess, (state, { users, pagination }) => ({
    ...state,
    isLoading: false,
    users,
    pagination,
    error: null,
  })),

  on(UserActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // ========== Toggle User Status ==========
  on(UserActions.toggleUserStatus, (state) => ({
    ...state,
    isTogglingStatus: true,
    error: null,
  })),

  on(UserActions.toggleUserStatusSuccess, (state) => ({
    ...state,
    isTogglingStatus: false,
    error: null,
  })),

  on(UserActions.toggleUserStatusFailure, (state, { error }) => ({
    ...state,
    isTogglingStatus: false,
    error,
  })),

  // ========== Hard Delete User ==========
  on(UserActions.hardDeleteUser, (state) => ({
    ...state,
    isDeleting: true,
    error: null,
  })),

  on(UserActions.hardDeleteUserSuccess, (state) => ({
    ...state,
    isDeleting: false,
    error: null,
  })),

  on(UserActions.hardDeleteUserFailure, (state, { error }) => ({
    ...state,
    isDeleting: false,
    error,
  })),

  // ========== Change Page ==========
  on(UserActions.changePage, (state, { page }) => ({
    ...state,
    currentParams: {
      ...state.currentParams,
      page,
    },
  })),

  // ========== Clear Error ==========
  on(UserActions.clearUserError, (state) => ({
    ...state,
    error: null,
  })),

  // ========== Load User Detail ==========
  on(UserActions.loadUserDetail, (state) => ({
    ...state,
    isLoadingDetail: true,
    errorDetail: null,
  })),

  on(UserActions.loadUserDetailSuccess, (state, { user }) => ({
    ...state,
    isLoadingDetail: false,
    selectedUser: user,
    errorDetail: null,
  })),

  on(UserActions.loadUserDetailFailure, (state, { error }) => ({
    ...state,
    isLoadingDetail: false,
    errorDetail: error,
  })),

  // ========== Load User Account Info ==========
  on(UserActions.loadUserAccountInfoSuccess, (state, { accountInfo }) => ({
    ...state,
    selectedUser: state.selectedUser
      ? {
          ...state.selectedUser,
          account: {
            userId: accountInfo.userId,
            email: accountInfo.email,
            enabled: accountInfo.enabled,
            userStatus: accountInfo.userStatus,
          },
        }
      : null,
  })),

  // ========== Toggle User Detail Status ==========
  on(UserActions.toggleUserDetailStatus, (state) => ({
    ...state,
    isLoadingDetail: true,
    errorDetail: null,
  })),

  on(UserActions.toggleUserDetailStatusSuccess, (state) => ({
    ...state,
    isLoadingDetail: false,
    errorDetail: null,
  })),

  on(UserActions.toggleUserDetailStatusFailure, (state, { error }) => ({
    ...state,
    isLoadingDetail: false,
    errorDetail: error,
  })),

  // ========== Delete User Detail Account ==========
  on(UserActions.deleteUserDetailAccount, (state) => ({
    ...state,
    isLoadingDetail: true,
    errorDetail: null,
  })),

  on(UserActions.deleteUserDetailAccountSuccess, (state) => ({
    ...state,
    isLoadingDetail: false,
    selectedUser: null,
    errorDetail: null,
  })),

  on(UserActions.deleteUserDetailAccountFailure, (state, { error }) => ({
    ...state,
    isLoadingDetail: false,
    errorDetail: error,
  })),

  // ========== Clear User Detail ==========
  on(UserActions.clearUserDetail, (state) => ({
    ...state,
    selectedUser: null,
    errorDetail: null,
  }))
);
