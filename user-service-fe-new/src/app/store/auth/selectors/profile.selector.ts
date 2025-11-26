import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProfileState } from '../state/profile.state';

export const selectProfileState = createFeatureSelector<ProfileState>('profile');

// Basic selectors
export const selectProfile = createSelector(
  selectProfileState,
  (state: ProfileState) => state.profile
);

export const selectIsEditMode = createSelector(
  selectProfileState,
  (state: ProfileState) => state.isEditMode
);

// Loading selectors
export const selectIsLoading = createSelector(
  selectProfileState,
  (state: ProfileState) => state.isLoading
);

export const selectIsSaving = createSelector(
  selectProfileState,
  (state: ProfileState) => state.isSaving
);

// Error selector
export const selectProfileError = createSelector(
  selectProfileState,
  (state: ProfileState) => state.error
);