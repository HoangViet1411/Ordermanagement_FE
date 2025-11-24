"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.OrderStatus = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["COD"] = "cod";
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["PAYPAL"] = "paypal";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
class Order extends sequelize_1.Model {
}
Order.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: OrderStatus.PENDING,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount',
        validate: {
            min: 0,
        },
    },
    note: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    shippingAddress: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'shipping_address',
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('cod', 'credit_card', 'bank_transfer', 'paypal'),
        allowNull: true,
        field: 'payment_method',
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
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    paranoid: true,
});
exports.default = Order;
//# sourceMappingURL=Order.js.map