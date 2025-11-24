"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gender = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
    Gender["OTHER"] = "other";
})(Gender || (exports.Gender = Gender = {}));
class User extends sequelize_1.Model {
}
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
    },
    birthDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'birth_date',
    },
    gender: {
        type: sequelize_1.DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
    },
    createdBy: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'created_by',
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
    },
    updatedBy: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'updated_by',
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: true,
});
exports.default = User;
//# sourceMappingURL=User.js.map