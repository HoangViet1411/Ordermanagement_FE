import { createAction, props } from '@ngrx/store';
import { ProfileData, ProfileResponse } from '../../../core/services/user.service';

// Load Profile Actions
export const loadProfile = createAction(
    '[Profile] Load Profile'
);

export const loadProfileSuccess = createAction(
    '[Profile] Load Profile Success',
    props<{ profile: ProfileResponse }>()
);

export const loadProfileFailure = createAction(
    '[Profile] load Profile Failure',
    props<{ error: string }>()
);

export const createOrUpdateProfile = createAction(
    '[Profile] Create or Update Profile',
    props<{ profileData: ProfileData }>()
);

export const createOrUpdateProfileSuccess = createAction(
    '[Profile] Create or Update Profile Success',
    props<{ profile: ProfileResponse }>()
);

export const createOrUpdateProfileFailure = createAction(
    '[Profile] Create or Update Profile Failure',
    props<{ error: string }>()
);

export const clearProfileError = createAction(
    '[Profile] Clear Profile Error'
);