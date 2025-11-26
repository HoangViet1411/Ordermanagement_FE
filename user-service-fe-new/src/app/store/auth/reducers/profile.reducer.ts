import { createReducer, on } from '@ngrx/store';
import { initialProfileState, ProfileState } from '../state/profile.state';
import * as ProfileActions from '../actions/profile.action';

export const profileReducer = createReducer(
    initialProfileState,

    // load profile
    on(ProfileActions.loadProfile, (state) => ({
        ...state,
        isLoading: true,
        error: null
    })),
    on(ProfileActions.loadProfileSuccess, (state, { profile }) => ({
        ...state,
        profile,
        isLoading: false,
        isEditMode: profile.success && !!profile.data,
        error: null
    })),
    on(ProfileActions.loadProfileFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),
    
    // create or update profile
    on(ProfileActions.createOrUpdateProfile, (state) => ({
        ...state,
        isSaving: true,
        error: null
    })),
    on(ProfileActions.createOrUpdateProfileSuccess, (state, { profile }) => ({
        ...state,
        profile,
        isSaving: false,
        isEditMode: true,
        error: null
    })),
    on(ProfileActions.createOrUpdateProfileFailure, (state, { error }) => ({
        ...state,
        isSaving: false,
        error
    })),

    // clear profile error
    on(ProfileActions.clearProfileError, (state) => ({
        ...state,
        error: null
    })),
)