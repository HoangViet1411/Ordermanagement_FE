"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = exports.idParamSchema = exports.updateOrderSchema = exports.createOrderSchema = exports.createOrderItemSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const Order_1 = require("../models/Order");
exports.createOrderItemSchema = joi_1.default.object({
    product_id: joi_1.default.number().integer().positive().required().messages({
        'number.base': 'product_id must be a number',
        'number.integer': 'product_id must be an integer',
        'number.positive': 'product_id must be positive',
        'any.required': 'product_id is required',
    }),
    quantity: joi_1.default.number().integer().min(1).required().messages({
        'number.base': 'quantity must be a number',
        'number.integer': 'quantity must be an integer',
        'number.min': 'quantity must be at least 1',
        'any.required': 'quantity is required',
    }),
    unit_price: joi_1.default.number().positive().optional().messages({
        'number.base': 'unit_price must be a number',
        'number.positive': 'unit_price must be positive',
    }),
});
exports.createOrderSchema = joi_1.default.object({
    user_id: joi_1.default.number().integer().positive().required().messages({
        'number.base': 'user_id must be a number',
        'number.integer': 'user_id must be an integer',
        'number.positive': 'user_id must be positive',
        'any.required': 'user_id is required',
    }),
    status: joi_1.default.string()
        .valid(...Object.values(Order_1.OrderStatus))
        .optional()
        .messages({
        'any.only': `status must be one of: ${Object.values(Order_1.OrderStatus).join(', ')}`,
    }),
    note: joi_1.default.string().optional().allow(null, '').messages({
        'string.base': 'note must be a string',
    }),
    shipping_address: joi_1.default.string().optional().allow(null, '').messages({
        'string.base': 'shipping_address must be a string',
    }),
    payment_method: joi_1.default.string()
        .valid(...Object.values(Order_1.PaymentMethod))
        .optional()
        .allow(null, '')
        .messages({
        'any.only': `payment_method must be one of: ${Object.values(Order_1.PaymentMethod).join(', ')}`,
    }),
    items: joi_1.default.array()
        .items(exports.createOrderItemSchema)
        .min(1)
        .required()
        .messages({
        'array.base': 'items must be an array',
        'array.min': 'items must contain at least one item',
        'any.required': 'items is required',
    }),
});
exports.updateOrderSchema = joi_1.default.object({
    status: joi_1.default.string()
        .valid(...Object.values(Order_1.OrderStatus))
        .optional()
        .messages({
        'any.only': `status must be one of: ${Object.values(Order_1.OrderStatus).join(', ')}`,
    }),
    note: joi_1.default.string().optional().allow(null, '').messages({
        'string.base': 'note must be a string',
    }),
    shipping_address: joi_1.default.string().optional().allow(null, '').messages({
        'string.base': 'shipping_address must be a string',
    }),
    payment_method: joi_1.default.string()
        .valid(...Object.values(Order_1.PaymentMethod))
        .optional()
        .allow(null, '')
        .messages({
        'any.only': `payment_method must be one of: ${Object.values(Order_1.PaymentMethod).join(', ')}`,
    }),
    items: joi_1.default.array()
        .items(exports.createOrderItemSchema)
        .optional()
        .messages({
        'array.base': 'items must be an array',
    }),
});
var uservalidation_1 = require("./uservalidation");
Object.defineProperty(exports, "idParamSchema", { enumerable: true, get: function () { return uservalidation_1.idParamSchema; } });
var uservalidation_2 = require("./uservalidation");
Object.defineProperty(exports, "paginationQuerySchema", { enumerable: true, get: function () { return uservalidation_2.paginationQuerySchema; } });
//# sourceMappingURL=orderValidation.js.map