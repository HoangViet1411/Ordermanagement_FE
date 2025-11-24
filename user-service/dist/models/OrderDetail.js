"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class OrderDetail extends sequelize_1.Model {
}
OrderDetail.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    orderId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'order_id',
        references: {
            model: 'orders',
            key: 'id',
        },
    },
    productId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'product_id',
        references: {
            model: 'products',
            key: 'id',
        },
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
            min: 1,
        },
    },
    unitPrice: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'unit_price',
        validate: {
            min: 0,
        },
    },
    lineTotal: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: true,
        field: 'line_total',
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
}, {
    sequelize: database_1.sequelize,
    tableName: 'order_details',
    timestamps: true,
    underscored: true,
    paranoid: false,
});
exports.default = OrderDetail;
//# sourceMappingURL=OrderDetail.js.map