import { Gender } from '../models/User';
import type { RoleResponse } from './roleTypes';
export interface CreateUserDto {
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    gender?: Gender;
    created_by?: number;
    role_ids?: number[];
}
export interface UpdateUserDto {
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    gender?: Gender;
    updated_by?: number;
    role_ids?: number[];
}
export interface UserResponse {
    id: number;
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
    roles?: RoleResponse[];
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
export type { CreateRoleDto, UpdateRoleDto, RoleResponse } from './roleTypes';
export type { CreateProductDto, UpdateProductDto, ProductResponse } from './productTypes';
export type { CreateOrderDto, CreateOrderItemDto, UpdateOrderDto, OrderResponse, OrderDetailResponse, } from './orderTypes';
//# sourceMappingURL=index.d.ts.map