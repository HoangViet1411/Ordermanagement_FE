import { OrderStatus, PaymentMethod } from '../models/Order';
export interface CreateOrderItemDto {
    product_id: number;
    quantity: number;
    unit_price?: number;
}
export interface CreateOrderDto {
    user_id: number;
    status?: OrderStatus;
    note?: string | null;
    shipping_address?: string | null;
    payment_method?: PaymentMethod | null;
    items: CreateOrderItemDto[];
}
export interface UpdateOrderDto {
    status?: OrderStatus;
    note?: string | null;
    shipping_address?: string | null;
    payment_method?: PaymentMethod | null;
    items?: CreateOrderItemDto[];
}
export interface OrderDetailResponse {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    lineTotal: number | null;
    createdAt?: Date;
    updatedAt?: Date;
    product?: {
        id: number;
        name: string;
        price: number;
    };
}
export interface OrderResponse {
    id: number;
    userId: number;
    status: OrderStatus;
    totalAmount: number;
    note: string | null;
    shippingAddress: string | null;
    paymentMethod: PaymentMethod | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    user?: {
        id: number;
        firstName: string;
        lastName: string;
    };
    items?: OrderDetailResponse[];
}
//# sourceMappingURL=orderTypes.d.ts.map