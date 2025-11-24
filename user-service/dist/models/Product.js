"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Product extends sequelize_1.Model {
}
Product.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
        {
            name: 'idx_products_price',
            fields: ['price'],
        },
        {
            name: 'idx_products_name',
            fields: ['name'],
        },
        {
            name: 'idx_products_price_deleted',
            fields: ['price', 'deleted_at'],
        },
        {
            name: 'idx_products_name_deleted',
            fields: ['name', 'deleted_at'],
        },
        {
            name: 'idx_products_fulltext',
            type: 'FULLTEXT',
            fields: ['name', 'description'],
        },
    ],
});
exports.default = Product;
//# sourceMappingURL=Product.js.map