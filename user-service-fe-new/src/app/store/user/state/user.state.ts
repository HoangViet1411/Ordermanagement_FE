import { User, Pagination } from '../../../core/services/user.service';

export interface UserState {
  // Users list
  users: User[];
  
  // Pagination
  pagination: Pagination | null;
  
  // Current page params
  currentParams: {
    page: number;
    limit: number;
    includeAccount: string;
    include_deleted: boolean;
  };
  
  // User detail
  selectedUser: User | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingDetail: boolean;
  isTogglingStatus: boolean;
  isDeleting: boolean;
  
  // Error state
  error: string | null;
  errorDetail: string | null;
}

export const initialUserState: UserState = {
  users: [],
  pagination: null,
  currentParams: {
    page: 1,
    limit: 10,
    includeAccount: 'true',
    include_deleted: true,
  },
  selectedUser: null,
  isLoading: false,
  isLoadingDetail: false,
  isTogglingStatus: false,
  isDeleting: false,
  error: null,
  errorDetail: null,
};

