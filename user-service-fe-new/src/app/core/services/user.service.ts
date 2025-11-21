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

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  cognito_user_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface UsersResponse {
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
  includeAccount?: boolean;
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

  getUsers(params: UsersParams): Observable<UsersResponse> {
    return this.api.get<UsersResponse>('/users', { params });
  }
}