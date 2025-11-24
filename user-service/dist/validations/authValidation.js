"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signInSchema = exports.signUpSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.signUpSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.base': 'email must be a string',
        'string.email': 'email must be a valid email address',
        'any.required': 'email is required',
    }),
    password: joi_1.default.string().min(8).required().messages({
        'string.base': 'password must be a string',
        'string.min': 'password must be at least 8 characters long',
        'any.required': 'password is required',
    }),
});
exports.signInSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.base': 'email must be a string',
        'string.email': 'email must be a valid email address',
        'any.required': 'email is required',
    }),
    password: joi_1.default.string().required().messages({
        'string.base': 'password must be a string',
        'any.required': 'password is required',
    }),
});
//# sourceMappingURL=authValidation.js.map