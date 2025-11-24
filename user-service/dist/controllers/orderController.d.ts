import type { Request, Response } from 'express';
export declare class OrderController {
    createOrder(req: Request, res: Response): Promise<void>;
    getOrderById(req: Request, res: Response): Promise<void>;
    getAllOrders(req: Request, res: Response): Promise<void>;
    updateOrder(req: Request, res: Response): Promise<void>;
    deleteOrder(req: Request, res: Response): Promise<void>;
    hardDeleteOrder(req: Request, res: Response): Promise<void>;
    restoreOrder(req: Request, res: Response): Promise<void>;
}
declare const _default: OrderController;
export default _default;
//# sourceMappingURL=orderController.d.ts.map