import { type Transaction } from 'sequelize';
import { Gender } from '../models/User';
import type { CreateUserDto, UpdateUserDto, UserResponse, PaginatedResponse } from '../types';
export interface UserFilterParams {
    search?: string;
    first_name?: string;
    last_name?: string;
    birth_date_from?: string;
    birth_date_to?: string;
    gender?: Gender;
    include_deleted?: boolean;
    fields?: string;
    include?: string;
}
export declare class UserService {
    createUser(userData: CreateUserDto): Promise<UserResponse>;
    getUserById(id: number): Promise<UserResponse | null>;
    getAllUsers(page?: number, limit?: number, filters?: UserFilterParams): Promise<PaginatedResponse<UserResponse>>;
    updateUser(id: number, userData: UpdateUserDto, opts?: {
        transaction?: Transaction;
    }): Promise<UserResponse | null>;
    private _updateUserWithTransaction;
    private _updateUserInternal;
    deleteUser(id: number): Promise<boolean>;
    hardDeleteUser(id: number): Promise<boolean>;
    restoreUser(id: number): Promise<boolean>;
    private mapToUserResponse;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=userService.d.ts.map