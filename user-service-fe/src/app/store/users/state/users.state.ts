import { User, PaginationMeta } from '../../../features/users/services/user.service';

export interface UsersState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
}

export const initialUsersState: UsersState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  pagination: null
};

