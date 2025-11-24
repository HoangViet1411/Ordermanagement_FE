import type { CreateRoleDto, UpdateRoleDto, RoleResponse, PaginatedResponse } from '../types';
export interface RoleFilterParams {
    search?: string;
    role_name?: string;
    include_deleted?: boolean;
}
export declare class RoleService {
    createRole(roleData: CreateRoleDto): Promise<RoleResponse>;
    getRoleById(id: number): Promise<RoleResponse | null>;
    getAllRoles(page?: number, limit?: number, filters?: RoleFilterParams): Promise<PaginatedResponse<RoleResponse>>;
    updateRole(id: number, roleData: UpdateRoleDto): Promise<RoleResponse | null>;
    deleteRole(id: number): Promise<boolean>;
    hardDeleteRole(id: number): Promise<boolean>;
    restoreRole(id: number): Promise<boolean>;
    private mapToRoleResponse;
}
declare const _default: RoleService;
export default _default;
//# sourceMappingURL=roleService.d.ts.map