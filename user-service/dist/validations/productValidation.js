"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = exports.idParamSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createProductSchema = joi_1.default.object({
    name: joi_1.default.string().max(255).required().messages({
        'string.base': 'name must be a string',
        'string.max': 'name must be less than 255 characters',
        'any.required': 'name is required',
        'string.empty': 'name cannot be empty',
    }),
    price: joi_1.default.number().positive().required().messages({
        'number.base': 'price must be a number',
        'number.positive': 'price must be positive',
        'any.required': 'price is required',
    }),
    description: joi_1.default.string().optional().allow(null, ''),
    quantity: joi_1.default.number().integer().min(0).optional().messages({
        'number.base': 'quantity must be a number',
        'number.integer': 'quantity must be an integer',
        'number.min': 'quantity must be >= 0',
    }),
});
exports.updateProductSchema = joi_1.default.object({
    name: joi_1.default.string().max(255).optional().min(1).messages({
        'string.base': 'name must be a string',
        'string.max': 'name must be less than 255 characters',
        'string.min': 'name cannot be empty',
    }),
    price: joi_1.default.number().positive().optional().messages({
        'number.base': 'price must be a number',
        'number.positive': 'price must be positive',
    }),
    description: joi_1.default.string().optional().allow(null, ''),
    quantity: joi_1.default.number().integer().min(0).optional().messages({
        'number.base': 'quantity must be a number',
        'number.integer': 'quantity must be an integer',
        'number.min': 'quantity must be >= 0',
    }),
});
var uservalidation_1 = require("./uservalidation");
Object.defineProperty(exports, "idParamSchema", { enumerable: true, get: function () { return uservalidation_1.idParamSchema; } });
var uservalidation_2 = require("./uservalidation");
Object.defineProperty(exports, "paginationQuerySchema", { enumerable: true, get: function () { return uservalidation_2.paginationQuerySchema; } });
//# sourceMappingURL=productValidation.js.map