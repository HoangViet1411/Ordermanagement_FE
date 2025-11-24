"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderDetail = exports.Order = exports.Product = exports.UserRole = exports.Role = exports.User = void 0;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const Role_1 = __importDefault(require("./Role"));
exports.Role = Role_1.default;
const UserRole_1 = __importDefault(require("./UserRole"));
exports.UserRole = UserRole_1.default;
const Product_1 = __importDefault(require("./Product"));
exports.Product = Product_1.default;
const Order_1 = __importDefault(require("./Order"));
exports.Order = Order_1.default;
const OrderDetail_1 = __importDefault(require("./OrderDetail"));
exports.OrderDetail = OrderDetail_1.default;
User_1.default.belongsToMany(Role_1.default, {
    through: UserRole_1.default,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'roles',
});
Role_1.default.belongsToMany(User_1.default, {
    through: UserRole_1.default,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users',
});
User_1.default.hasMany(Order_1.default, {
    foreignKey: 'user_id',
    as: 'orders',
});
Order_1.default.belongsTo(User_1.default, {
    foreignKey: 'user_id',
    as: 'user',
});
Order_1.default.hasMany(OrderDetail_1.default, {
    foreignKey: 'order_id',
    as: 'items',
});
OrderDetail_1.default.belongsTo(Order_1.default, {
    foreignKey: 'order_id',
    as: 'order',
});
Product_1.default.hasMany(OrderDetail_1.default, {
    foreignKey: 'product_id',
    as: 'orderDetails',
});
OrderDetail_1.default.belongsTo(Product_1.default, {
    foreignKey: 'product_id',
    as: 'product',
});
//# sourceMappingURL=index.js.map