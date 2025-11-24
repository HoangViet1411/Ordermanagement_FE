"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = exports.idParamSchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createRoleSchema = joi_1.default.object({
    role_name: joi_1.default.string().max(100).required().messages({
        'string.base': 'role_name must be a string',
        'string.max': 'role_name must be less than 100 characters',
        'any.required': 'role_name is required',
        'string.empty': 'role_name cannot be empty',
    }),
    description: joi_1.default.string().optional().allow(null, ''),
});
exports.updateRoleSchema = joi_1.default.object({
    role_name: joi_1.default.string().max(100).optional().min(1).messages({
        'string.base': 'role_name must be a string',
        'string.max': 'role_name must be less than 100 characters',
        'string.min': 'role_name cannot be empty',
    }),
    description: joi_1.default.string().optional().allow(null, ''),
});
var uservalidation_1 = require("./uservalidation");
Object.defineProperty(exports, "idParamSchema", { enumerable: true, get: function () { return uservalidation_1.idParamSchema; } });
var uservalidation_2 = require("./uservalidation");
Object.defineProperty(exports, "paginationQuerySchema", { enumerable: true, get: function () { return uservalidation_2.paginationQuerySchema; } });
//# sourceMappingURL=roleValidation.js.map