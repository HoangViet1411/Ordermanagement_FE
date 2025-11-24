import { OrderStatus } from '../models/Order';
import type { CreateOrderDto, UpdateOrderDto, OrderResponse, PaginatedResponse } from '../types';
export interface OrderFilterParams {
    user_id?: number;
    status?: OrderStatus;
    total_amount_from?: number;
    total_amount_to?: number;
    include_deleted?: boolean;
    fields?: string;
    include?: string;
}
export declare class OrderService {
    createOrder(orderData: CreateOrderDto): Promise<OrderResponse>;
    getOrderById(id: number, includeItems?: boolean): Promise<OrderResponse | null>;
    getAllOrders(page?: number, limit?: number, filters?: OrderFilterParams): Promise<PaginatedResponse<OrderResponse>>;
    updateOrder(id: number, orderData: UpdateOrderDto): Promise<OrderResponse | null>;
    deleteOrder(id: number): Promise<boolean>;
    hardDeleteOrder(id: number): Promise<boolean>;
    restoreOrder(id: number): Promise<boolean>;
    private mapToOrderResponse;
}
declare const _default: OrderService;
export default _default;
//# sourceMappingURL=orderService.d.ts.map