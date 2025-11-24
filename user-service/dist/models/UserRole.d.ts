import { Model, type Optional } from 'sequelize';
export interface UserRoleAttributes {
    id: number;
    userId: number;
    roleId: number;
    createdAt: Date;
    updatedAt: Date;
}
interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
    id: number;
    userId: number;
    roleId: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default UserRole;
//# sourceMappingURL=UserRole.d.ts.map