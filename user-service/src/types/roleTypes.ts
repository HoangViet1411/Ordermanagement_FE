
export interface CreateRoleDto {
    role_name?: string;
    description?: string   ;

}

export interface UpdateRoleDto {
    role_name?: string;
    description?: string;
}

export interface RoleResponse {
    id?: number;
    role_name?: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}
