import { ProfileResponse } from '../../../core/services/user.service';
 export interface ProfileState {
    profile: ProfileResponse | null;

    isLoading: boolean;
    isSaving: boolean;

    error: string | null;

    isEditMode: boolean;
 }

 export const initialProfileState: ProfileState = {
    profile: null,
    isLoading: false,
    isSaving: false,
    error: null,
    isEditMode: false,
 }