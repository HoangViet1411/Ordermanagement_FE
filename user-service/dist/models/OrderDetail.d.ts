import { Model, type Optional } from 'sequelize';
export interface OrderDetailAttributes {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    lineTotal: number | null;
    createdAt: Date;
    updatedAt: Date;
}
interface OrderDetailCreationAttributes extends Optional<OrderDetailAttributes, 'id' | 'lineTotal' | 'createdAt' | 'updatedAt'> {
}
declare class OrderDetail extends Model<OrderDetailAttributes, OrderDetailCreationAttributes> implements OrderDetailAttributes {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    lineTotal: number | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default OrderDetail;
//# sourceMappingURL=OrderDetail.d.ts.map