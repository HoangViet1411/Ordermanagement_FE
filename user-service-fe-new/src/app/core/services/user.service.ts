import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ProfileData {
  first_name: string;
  last_name: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface ProfileResponse {
  success: boolean;
  data: any;
  message: string;
}

export interface Role {
  id: number;
  roleName: string;
}

export interface User {
  id: number;
  // Backend trả về camelCase
  firstName?: string;
  lastName?: string;
  first_name?: string; // Fallback cho snake_case
  last_name?: string; // Fallback cho snake_case
  birthDate?: string;
  birth_date?: string; // Fallback
  gender?: 'male' | 'female' | 'other';
  cognitoUserId?: string;
  cognito_user_id?: string; // Fallback
  createdAt?: string;
  created_at?: string; // Fallback
  updatedAt?: string;
  updated_at?: string; // Fallback
  deletedAt?: string;
  deleted_at?: string; // Fallback
  roles?: Role[];
  account?: {
    userId: string;
    email: string;
    username?: string;
    enabled: boolean;
    userStatus: string; 
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: Pagination;
}

export interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
  first_name?: string;
  last_name?: string;
  birth_date_from?: string;
  birth_date_to?: string;
  gender?: 'male' | 'female' | 'other';
  include_deleted?: boolean;
  includeAccount?: string; 
}

export interface UserResponse {
  success: boolean;
  data: User;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  getProfile(): Observable<ProfileResponse> {
    return this.api.get<ProfileResponse>('/users/profile');
  }

  createOrUpdateProfile(data: ProfileData): Observable<ProfileResponse> {
    return this.api.post<ProfileResponse>('/users/profile', data);
  }


  getUsers(params: UsersParams = {}): Observable<UsersResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.first_name) queryParams.append('first_name', params.first_name);
    if (params.last_name) queryParams.append('last_name', params.last_name);
    if (params.birth_date_from) queryParams.append('birth_date_from', params.birth_date_from);
    if (params.birth_date_to) queryParams.append('birth_date_to', params.birth_date_to);
    if (params.gender) queryParams.append('gender', params.gender);
    if (params.include_deleted !== undefined) {
      queryParams.append('include_deleted', params.include_deleted.toString());
    }
    if (params.includeAccount) {
      // Gửi đúng key backend đang đọc: includeAccount=true
      queryParams.append('includeAccount', params.includeAccount);
    }

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? '?' + queryString : ''}`;

    return this.api.get<UsersResponse>(endpoint);
  }

  getUserById(id: number, includeAccount: boolean = true): Observable<UserResponse> {
    const queryParams = new URLSearchParams();

    if (includeAccount) {
      queryParams.append('includeAccount', 'true');
    }

    const queryString = queryParams.toString();
    const endpoint = `/users/${id}${queryString ? '?' + queryString : ''}`;

    return this.api.get<UserResponse>(endpoint);
  }

  softDeleteUser(id: number): Observable<ProfileResponse> {
    return this.api.delete<ProfileResponse>(`/users/${id}`);
  }

  restoreUser(id: number): Observable<ProfileResponse> {
    return this.api.post<ProfileResponse>(`/users/${id}/restore`, {});
  }

  hardDeleteUser(id: number): Observable<ProfileResponse> {
    return this.api.delete<ProfileResponse>(`/users/${id}/hard`);
  }

  // Lấy account info từ Cognito (email, status, etc.)
  getUserAccount(id: number): Observable<{ success: boolean; data: { userId: string; email: string; enabled: boolean; userStatus: string } }> {
    return this.api.get<{ success: boolean; data: { userId: string; email: string; enabled: boolean; userStatus: string } }>(`/users/${id}/account`);
  }
}
