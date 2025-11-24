import { Model, type Optional } from 'sequelize';
export interface RoleAttributes {
    id: number;
    roleName: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {
}
declare class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    id: number;
    roleName: string;
    description: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    deletedAt: Date | null;
}
export default Role;
//# sourceMappingURL=Role.d.ts.map