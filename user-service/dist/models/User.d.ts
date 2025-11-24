import { Model, type Optional } from 'sequelize';
export declare enum Gender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}
export interface UserAttributes {
    id: number;
    firstName: string;
    lastName: string;
    birthDate: Date | null;
    gender: Gender | null;
    createdAt: Date;
    createdBy: number | null;
    updatedAt: Date;
    updatedBy: number | null;
    deletedAt: Date | null;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'firstName' | 'lastName' | 'birthDate' | 'gender' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> {
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: number;
    firstName: string;
    lastName: string;
    birthDate: Date | null;
    gender: Gender | null;
    readonly createdAt: Date;
    createdBy: number | null;
    readonly updatedAt: Date;
    updatedBy: number | null;
    deletedAt: Date | null;
}
export default User;
//# sourceMappingURL=User.d.ts.map