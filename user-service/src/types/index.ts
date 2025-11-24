import { Gender } from '../models/User';
import type { RoleResponse } from './roleTypes';

export interface CreateUserDto {
  cognito_user_id?: string; // Cognito UserSub to link with database user
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: Gender;
  created_by?: number;
  role_ids?: number[]; // Array of role IDs for N-N relationship
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: Gender;
  updated_by?: number;
  role_ids?: number[]; // Array of role IDs for N-N relationship
}

export interface UserResponse {
  id: number;
  cognitoUserId?: string | null; // Cognito UserSub to link with Cognito user
  firstName: string; // NOT NULL in database
  lastName: string; // NOT NULL in database
  birthDate: Date | null;
  gender: Gender | null;
  createdAt?: Date;
  createdBy?: number | null;
  updatedAt?: Date;
  updatedBy?: number | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  roles?: RoleResponse[]; // Include roles when loaded with associations
  // Cognito account info (optional, only when includeAccount=true)
  account?: {
    userId: string; // Cognito userId
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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Export Role types from roleTypes.ts
export type { CreateRoleDto, UpdateRoleDto, RoleResponse } from './roleTypes';

// Export Product types from productTypes.ts
export type { CreateProductDto, UpdateProductDto, ProductResponse } from './productTypes';

// Export Order types from orderTypes.ts
export type {
  CreateOrderDto,
  CreateOrderItemDto,
  UpdateOrderDto,
  OrderResponse,
  OrderDetailResponse,
} from './orderTypes';