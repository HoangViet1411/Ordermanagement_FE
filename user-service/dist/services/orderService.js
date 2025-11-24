"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const Order_1 = __importStar(require("../models/Order"));
const OrderDetail_1 = __importDefault(require("../models/OrderDetail"));
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
const sequelize_1 = require("sequelize");
const Transactional_1 = require("../decorators/Transactional");
class OrderService {
    async createOrder(orderData) {
        console.log('OrderService.createOrder - orderData received:', JSON.stringify(orderData));
        console.log('OrderService.createOrder - orderData type:', typeof orderData);
        console.log('OrderService.createOrder - orderData.user_id:', orderData?.user_id);
        if (!orderData) {
            throw new Error('orderData is required');
        }
        if (process.env['TEST_TRANSACTION'] === 'true') {
            throw new Error('Test transaction rollback - Order should not be created');
        }
        const user = await User_1.default.findByPk(orderData.user_id);
        if (!user) {
            throw new Error(`User with ID ${orderData.user_id} not found`);
        }
        const productIds = orderData.items.map((item) => item.product_id);
        const uniqueProductIds = [...new Set(productIds)];
        const products = await Product_1.default.findAll({
            where: { id: uniqueProductIds },
        });
        if (products.length !== uniqueProductIds.length) {
            const foundProductIds = products.map((p) => p.id);
            const missingProductIds = uniqueProductIds.filter((id) => !foundProductIds.includes(id));
            throw new Error(`Products with IDs [${missingProductIds.join(', ')}] not found`);
        }
        const productMap = new Map(products.map((p) => [p.id, p]));
        const orderDetails = [];
        for (const item of orderData.items) {
            const product = productMap.get(item.product_id);
            if (!product) {
                throw new Error(`Product with ID ${item.product_id} not found`);
            }
            if (product.quantity < item.quantity) {
                throw new Error(`Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
            }
            const unitPrice = item.unit_price ?? Number(product.price);
            orderDetails.push({
                productId: item.product_id,
                quantity: item.quantity,
                unitPrice,
            });
        }
        const order = await Order_1.default.create({
            userId: orderData.user_id,
            status: orderData.status ?? Order_1.OrderStatus.PENDING,
            totalAmount: 0,
            note: orderData.note ?? null,
            shippingAddress: orderData.shipping_address ?? null,
            paymentMethod: orderData.payment_method ?? null,
        });
        const now = new Date();
        await OrderDetail_1.default.bulkCreate(orderDetails.map((detail) => ({
            orderId: order.id,
            productId: detail.productId,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            createdAt: now,
            updatedAt: now,
        })));
        for (const detail of orderDetails) {
            const product = productMap.get(detail.productId);
            await product.update({
                quantity: product.quantity - detail.quantity,
            });
        }
        await order.reload({
            attributes: ['id', 'status', 'totalAmount', 'note', 'shippingAddress', 'paymentMethod', 'createdAt'],
        });
        return this.mapToOrderResponse(order);
    }
    async getOrderById(id, includeItems = false) {
        const queryOptions = {
            attributes: ['id', 'status', 'totalAmount', 'note', 'shippingAddress', 'paymentMethod', 'createdAt'],
            include: [
                {
                    model: OrderDetail_1.default,
                    as: 'items',
                    attributes: ['id', 'quantity'],
                },
            ],
        };
        if (includeItems) {
            queryOptions.include = [
                {
                    model: OrderDetail_1.default,
                    as: 'items',
                    attributes: ['id', 'orderId', 'productId', 'quantity', 'unitPrice', 'lineTotal', 'createdAt', 'updatedAt'],
                    include: [
                        {
                            model: Product_1.default,
                            as: 'product',
                            attributes: ['id', 'name', 'price'],
                        },
                    ],
                },
            ];
        }
        const order = await Order_1.default.findByPk(id, queryOptions);
        return order ? this.mapToOrderResponse(order) : null;
    }
    async getAllOrders(page = 1, limit = 10, filters = {}) {
        const pageNumber = Math.max(1, page);
        const noPagination = limit === 0;
        const pageSize = noPagination ? 0 : Math.max(1, Math.min(100, limit));
        const offset = noPagination ? 0 : (pageNumber - 1) * pageSize;
        const whereConditions = [];
        if (filters.user_id !== undefined) {
            whereConditions.push({ userId: filters.user_id });
        }
        if (filters.status !== undefined) {
            whereConditions.push({ status: filters.status });
        }
        if (filters.total_amount_from !== undefined || filters.total_amount_to !== undefined) {
            const totalAmountCondition = {};
            if (filters.total_amount_from !== undefined) {
                totalAmountCondition[sequelize_1.Op.gte] = filters.total_amount_from;
            }
            if (filters.total_amount_to !== undefined) {
                totalAmountCondition[sequelize_1.Op.lte] = filters.total_amount_to;
            }
            whereConditions.push({ totalAmount: totalAmountCondition });
        }
        let whereClause;
        if (whereConditions.length === 1) {
            whereClause = whereConditions[0];
        }
        else if (whereConditions.length > 1) {
            whereClause = { [sequelize_1.Op.and]: whereConditions };
        }
        const queryOptions = {
            attributes: ['id', 'status', 'totalAmount', 'note', 'shippingAddress', 'paymentMethod', 'createdAt'],
            order: [['id', 'DESC']],
            paranoid: filters.include_deleted === true ? false : true,
        };
        const includeDefs = [
            {
                model: OrderDetail_1.default,
                as: 'items',
                attributes: ['id', 'quantity'],
            },
        ];
        if (filters.include) {
            const includes = filters.include.split(',').map((s) => s.trim()).filter(Boolean);
            if (includes.includes('user')) {
                includeDefs.push({
                    model: User_1.default,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName'],
                });
            }
            if (includes.includes('items')) {
                const itemsIndex = includeDefs.findIndex((inc) => inc.as === 'items');
                if (itemsIndex >= 0) {
                    includeDefs[itemsIndex] = {
                        model: OrderDetail_1.default,
                        as: 'items',
                        attributes: ['id', 'orderId', 'productId', 'quantity', 'unitPrice', 'lineTotal', 'createdAt', 'updatedAt'],
                    };
                }
            }
            if (includes.includes('items.product')) {
                const itemsInclude = includeDefs.find((inc) => inc.as === 'items');
                if (itemsInclude) {
                    itemsInclude.include = [
                        {
                            model: Product_1.default,
                            as: 'product',
                            attributes: ['id', 'name', 'price'],
                        },
                    ];
                }
            }
        }
        queryOptions.include = includeDefs;
        queryOptions.distinct = true;
        if (!noPagination) {
            queryOptions.limit = pageSize;
            queryOptions.offset = offset;
        }
        if (whereClause) {
            queryOptions.where = whereClause;
        }
        const { rows: orders, count: total } = await Order_1.default.findAndCountAll(queryOptions);
        const totalPages = noPagination ? 1 : Math.ceil(total / pageSize);
        const responseLimit = noPagination ? total : pageSize;
        return {
            data: orders.map((order) => this.mapToOrderResponse(order)),
            pagination: {
                page: noPagination ? 1 : pageNumber,
                limit: responseLimit,
                total,
                totalPages,
                hasNext: pageNumber < totalPages,
                hasPrev: pageNumber > 1,
            },
        };
    }
    async updateOrder(id, orderData) {
        const order = await Order_1.default.findByPk(id, {
            include: [
                {
                    model: OrderDetail_1.default,
                    as: 'items',
                },
            ],
        });
        if (!order) {
            return null;
        }
        const updateData = {};
        if (orderData.status !== undefined) {
            updateData.status = orderData.status;
        }
        if (orderData.note !== undefined) {
            updateData.note = orderData.note || null;
        }
        if (orderData.shipping_address !== undefined) {
            updateData.shippingAddress = orderData.shipping_address || null;
        }
        if (orderData.payment_method !== undefined) {
            updateData.paymentMethod = orderData.payment_method || null;
        }
        if (orderData.items !== undefined) {
            const existingItems = (order.items || []);
            const existingItemsMap = new Map(existingItems.map((item) => [item.productId, item]));
            const newItemsMap = new Map(orderData.items.map((item) => [item.product_id, item]));
            const allProductIds = new Set([
                ...Array.from(existingItemsMap.keys()),
                ...Array.from(newItemsMap.keys()),
            ]);
            const products = await Product_1.default.findAll({
                where: { id: { [sequelize_1.Op.in]: Array.from(allProductIds) } },
            });
            const productMap = new Map(products.map((p) => [p.id, p]));
            const productQuantityChanges = new Map();
            for (const [productId, existingItem] of existingItemsMap) {
                const newItem = newItemsMap.get(productId);
                if (newItem) {
                    const quantityDelta = newItem.quantity - existingItem.quantity;
                    if (quantityDelta !== 0) {
                        const currentChange = productQuantityChanges.get(productId) || 0;
                        productQuantityChanges.set(productId, currentChange - quantityDelta);
                    }
                }
                else {
                    const currentChange = productQuantityChanges.get(productId) || 0;
                    productQuantityChanges.set(productId, currentChange + existingItem.quantity);
                }
            }
            for (const [productId, newItem] of newItemsMap) {
                if (!existingItemsMap.has(productId)) {
                    const currentChange = productQuantityChanges.get(productId) || 0;
                    productQuantityChanges.set(productId, currentChange - newItem.quantity);
                }
            }
            for (const [productId, quantityChange] of productQuantityChanges) {
                const product = productMap.get(productId);
                if (!product) {
                    throw new Error(`Product with ID ${productId} not found`);
                }
                if (quantityChange < 0 && product.quantity < Math.abs(quantityChange)) {
                    throw new Error(`Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Requested: ${Math.abs(quantityChange)}`);
                }
            }
            for (const [productId, quantityChange] of productQuantityChanges) {
                const product = productMap.get(productId);
                await product.update({
                    quantity: product.quantity + quantityChange,
                });
            }
            const now = new Date();
            for (const [productId, existingItem] of existingItemsMap) {
                const newItem = newItemsMap.get(productId);
                if (newItem) {
                    const product = productMap.get(productId);
                    const unitPrice = newItem.unit_price ?? Number(product.price);
                    const needsUpdate = existingItem.quantity !== newItem.quantity ||
                        Number(existingItem.unitPrice) !== unitPrice;
                    if (needsUpdate) {
                        await existingItem.update({
                            quantity: newItem.quantity,
                            unitPrice,
                            updatedAt: now,
                        });
                    }
                }
                else {
                    await existingItem.destroy();
                }
            }
            const itemsToCreate = [];
            for (const [productId, newItem] of newItemsMap) {
                if (!existingItemsMap.has(productId)) {
                    const product = productMap.get(productId);
                    const unitPrice = newItem.unit_price ?? Number(product.price);
                    itemsToCreate.push({
                        orderId: order.id,
                        productId: newItem.product_id,
                        quantity: newItem.quantity,
                        unitPrice,
                        createdAt: now,
                        updatedAt: now,
                    });
                }
            }
            if (itemsToCreate.length > 0) {
                await OrderDetail_1.default.bulkCreate(itemsToCreate);
            }
        }
        if (Object.keys(updateData).length > 0) {
            await order.update(updateData, {
                fields: Object.keys(updateData),
            });
        }
        const reloadOptions = {
            attributes: ['id', 'status', 'totalAmount', 'note', 'shippingAddress', 'paymentMethod', 'createdAt'],
        };
        if (orderData.items !== undefined) {
            reloadOptions.include = [
                {
                    model: OrderDetail_1.default,
                    as: 'items',
                    attributes: ['id', 'orderId', 'productId', 'quantity', 'unitPrice', 'lineTotal', 'createdAt', 'updatedAt'],
                },
            ];
        }
        await order.reload(reloadOptions);
        return this.mapToOrderResponse(order);
    }
    async deleteOrder(id) {
        const deletedCount = await Order_1.default.destroy({
            where: { id },
            limit: 1,
        });
        return deletedCount > 0;
    }
    async hardDeleteOrder(id) {
        const deletedCount = await Order_1.default.destroy({
            where: { id },
            limit: 1,
            force: true,
        });
        return deletedCount > 0;
    }
    async restoreOrder(id) {
        const order = await Order_1.default.findByPk(id, {
            paranoid: false,
            attributes: ['id', 'deletedAt'],
        });
        if (!order) {
            return false;
        }
        if (!order.deletedAt) {
            return false;
        }
        await order.restore();
        return true;
    }
    mapToOrderResponse(order) {
        const plainOrder = order.get({ plain: true });
        const response = {
            ...plainOrder,
            totalAmount: Number(plainOrder.totalAmount),
            ...(plainOrder.items && {
                items: plainOrder.items.map((item) => {
                    const mappedItem = {
                        id: item.id,
                        quantity: item.quantity,
                    };
                    if (item.orderId !== undefined) {
                        mappedItem.orderId = item.orderId;
                    }
                    if (item.productId !== undefined) {
                        mappedItem.productId = item.productId;
                    }
                    if (item.unitPrice !== undefined && item.unitPrice !== null) {
                        mappedItem.unitPrice = Number(item.unitPrice);
                    }
                    if (item.lineTotal !== undefined && item.lineTotal !== null) {
                        mappedItem.lineTotal = Number(item.lineTotal);
                    }
                    if (item.createdAt !== undefined) {
                        mappedItem.createdAt = item.createdAt;
                    }
                    if (item.updatedAt !== undefined) {
                        mappedItem.updatedAt = item.updatedAt;
                    }
                    if (item.product) {
                        mappedItem.product = {
                            id: item.product.id,
                            name: item.product.name,
                            price: Number(item.product.price),
                        };
                    }
                    return mappedItem;
                }),
            }),
        };
        return response;
    }
}
exports.OrderService = OrderService;
__decorate([
    (0, Transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderService.prototype, "createOrder", null);
__decorate([
    (0, Transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], OrderService.prototype, "updateOrder", null);
exports.default = new OrderService();
//# sourceMappingURL=orderService.js.map