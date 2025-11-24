import { Model, type Optional } from 'sequelize';
export declare enum OrderStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum PaymentMethod {
    COD = "cod",
    CREDIT_CARD = "credit_card",
    BANK_TRANSFER = "bank_transfer",
    PAYPAL = "paypal"
}
export interface OrderAttributes {
    id: number;
    userId: number;
    status: OrderStatus;
    totalAmount: number;
    note: string | null;
    shippingAddress: string | null;
    paymentMethod: PaymentMethod | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'totalAmount' | 'note' | 'shippingAddress' | 'paymentMethod' | 'createdAt' | 'updatedAt'> {
}
declare class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
    id: number;
    userId: number;
    status: OrderStatus;
    totalAmount: number;
    note: string | null;
    shippingAddress: string | null;
    paymentMethod: PaymentMethod | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    deletedAt: Date | null;
}
export default Order;
//# sourceMappingURL=Order.d.ts.map