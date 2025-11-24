"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const orderService_1 = __importDefault(require("../services/orderService"));
const Order_1 = require("../models/Order");
class OrderController {
    async createOrder(req, res) {
        try {
            const orderData = req.body;
            console.log('OrderController.createOrder - req.body:', JSON.stringify(req.body));
            console.log('OrderController.createOrder - orderData:', JSON.stringify(orderData));
            if (!orderData) {
                res.status(400).json({
                    success: false,
                    message: 'Request body is required',
                });
                return;
            }
            const order = await orderService_1.default.createOrder(orderData);
            res.status(201).json({
                success: true,
                data: order,
                message: 'Order created successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create order';
            console.error('Error creating order:', error);
            res.status(500).json({
                success: false,
                message: message || 'Failed to create order',
            });
        }
    }
    async getOrderById(req, res) {
        try {
            const id = req.params['id'];
            const includeItems = req.query['include'] === 'items' || req.query['include']?.toString().includes('items');
            const order = await orderService_1.default.getOrderById(id, includeItems);
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Order not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: order,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get order';
            console.error('Error getting order:', error);
            res.status(500).json({
                success: false,
                message: message || 'Failed to get order',
            });
        }
    }
    async getAllOrders(req, res) {
        try {
            const validatedQuery = req.validatedQuery || req.query;
            const page = validatedQuery['page'] ?? 1;
            const limit = validatedQuery['limit'] ?? 10;
            const filters = {};
            if (validatedQuery['user_id'] !== undefined) {
                const userId = Number(validatedQuery['user_id']);
                if (!isNaN(userId)) {
                    filters.user_id = userId;
                }
            }
            if (validatedQuery['status'] && typeof validatedQuery['status'] === 'string') {
                if (Object.values(Order_1.OrderStatus).includes(validatedQuery['status'])) {
                    filters.status = validatedQuery['status'];
                }
            }
            if (validatedQuery['total_amount_from'] !== undefined) {
                const totalAmountFrom = Number(validatedQuery['total_amount_from']);
                if (!isNaN(totalAmountFrom)) {
                    filters.total_amount_from = totalAmountFrom;
                }
            }
            if (validatedQuery['total_amount_to'] !== undefined) {
                const totalAmountTo = Number(validatedQuery['total_amount_to']);
                if (!isNaN(totalAmountTo)) {
                    filters.total_amount_to = totalAmountTo;
                }
            }
            if (validatedQuery['include_deleted'] !== undefined) {
                filters.include_deleted =
                    validatedQuery['include_deleted'] === true || validatedQuery['include_deleted'] === 'true';
            }
            if (validatedQuery['include'] && typeof validatedQuery['include'] === 'string') {
                filters.include = validatedQuery['include'];
            }
            const result = await orderService_1.default.getAllOrders(page, limit, filters);
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get orders';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async updateOrder(req, res) {
        try {
            const id = req.params['id'];
            const orderData = req.body;
            const order = await orderService_1.default.updateOrder(id, orderData);
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Order not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: order,
                message: 'Order updated successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update order';
            console.error('Error updating order:', error);
            res.status(500).json({
                success: false,
                message: message || 'Failed to update order',
            });
        }
    }
    async deleteOrder(req, res) {
        try {
            const id = req.params['id'];
            const deleted = await orderService_1.default.deleteOrder(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Order not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Order deleted successfully (soft delete)',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete order';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async hardDeleteOrder(req, res) {
        try {
            const id = req.params['id'];
            const deleted = await orderService_1.default.hardDeleteOrder(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Order not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Order permanently deleted from database',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to hard delete order';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async restoreOrder(req, res) {
        try {
            const id = req.params['id'];
            const restored = await orderService_1.default.restoreOrder(id);
            if (!restored) {
                res.status(404).json({
                    success: false,
                    message: 'Order not found or not deleted',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Order restored successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to restore order';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
exports.OrderController = OrderController;
exports.default = new OrderController();
//# sourceMappingURL=orderController.js.map