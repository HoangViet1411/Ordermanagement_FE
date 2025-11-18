import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export interface Role {
  id: number;
  roleName: string;
}

export interface User {
  id: number;
  cognitoUserId?: string | null;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  gender: Gender | null;
  createdAt?: Date;
  createdBy?: number | null;
  updatedAt?: Date;
  updatedBy?: number | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  roles?: Role[];
  account?: {
    userId: string;
    email: string;
    enabled: boolean;
    userStatus: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: PaginationMeta;
  message?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  first_name?: string;
  last_name?: string;
  gender?: Gender;
  include_deleted?: boolean;
  includeAccount?: string; // Include account info from Cognito ('true' or 'false')
}

export interface AccountInfo {
  userId: string;
  email: string;
  enabled: boolean;
  userStatus: string;
  createdAt?: Date;
  lastModified?: Date;
}

export interface CreateProfileDto {
  first_name: string;
  last_name: string;
  birth_date?: string;
  gender?: Gender;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getCurrentProfile(): Observable<ApiResponse<User | null>> {
    return this.apiService.get<ApiResponse<User | null>>(`/users/profile`);
  }

  createOrUpdateProfile(profileData: CreateProfileDto): Observable<ApiResponse<User>> {
    return this.apiService.post<ApiResponse<User>>(`/users/profile`, profileData);
  }

  getUsers(params: UserListParams = {}): Observable<ApiResponse<User[]>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.first_name) queryParams.append('first_name', params.first_name);
    if (params.last_name) queryParams.append('last_name', params.last_name);
    if (params.gender) queryParams.append('gender', params.gender);
    if (params.include_deleted !== undefined) {
      queryParams.append('include_deleted', params.include_deleted.toString());
    }
    if (params.includeAccount) {
      queryParams.append('includeAccount', params.includeAccount);
    }
    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? '?' + queryString : ''}`;
    return this.apiService.get<ApiResponse<User[]>>(endpoint);
  }

  getUserById(id: number, includeAccount: boolean = true): Observable<ApiResponse<User>> {
    const queryParams = includeAccount ? '?includeAccount=true' : '';
    return this.apiService.get<ApiResponse<User>>(`/users/${id}${queryParams}`);
  }

  getAccountInfo(id: number): Observable<ApiResponse<AccountInfo>> {
    return this.apiService.get<ApiResponse<AccountInfo>>(`/users/${id}/account`);
  }

  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`/users/${id}`);
  }

  resetPassword(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.apiService.post<ApiResponse<{ message: string }>>(`/users/${id}/reset-password`, {});
  }

  setPassword(id: number, password: string): Observable<ApiResponse<{ message: string }>> {
    return this.apiService.post<ApiResponse<{ message: string }>>(`/users/${id}/set-password`, { password });
  }

  updateEmail(id: number, email: string): Observable<ApiResponse<{ message: string }>> {
    return this.apiService.put<ApiResponse<{ message: string }>>(`/users/${id}/email`, { email });
  }

  hardDeleteUser(id: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`/users/${id}/hard`);
  }

  restoreUser(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.apiService.post<ApiResponse<{ message: string }>>(`/users/${id}/restore`, {});
  }

  updateUser(id: number, userData: { first_name?: string; last_name?: string; birth_date?: string; gender?: Gender }): Observable<ApiResponse<User>> {
    return this.apiService.put<ApiResponse<User>>(`/users/${id}`, userData);
  }
}

