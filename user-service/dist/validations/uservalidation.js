"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = exports.idParamSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../models/User");
const validateBirthDateFrom2000 = (value, helpers) => {
    const birthDate = new Date(value);
    const year2000 = new Date('2000-01-01');
    if (birthDate < year2000) {
        return helpers.error('date.min', {
            message: 'If gender is male, birth_date must be from year 2000 onwards',
        });
    }
    return value;
};
const createBirthDateSchema = (allowNull = false) => {
    const baseSchema = joi_1.default.string()
        .isoDate()
        .optional();
    const schemaWithAllow = allowNull ? baseSchema.allow(null, '') : baseSchema;
    return schemaWithAllow.when('gender', {
        is: 'male',
        then: joi_1.default.string()
            .isoDate()
            .required()
            .custom(validateBirthDateFrom2000)
            .messages({
            'any.required': 'birth_date is required when gender is male',
            'string.isoDate': 'birth_date must be a valid ISO date',
            'date.min': 'If gender is male, birth_date must be from year 2000 onwards',
        }),
        otherwise: joi_1.default.string().isoDate().optional().allow(null, ''),
    });
};
const createGenderSchema = (allowNull = false) => {
    const schema = joi_1.default.string().valid('male', 'female', 'other').max(10).optional();
    return allowNull ? schema.allow(null, '') : schema;
};
const baseUserSchema = {
    birth_date: createBirthDateSchema(false),
    gender: createGenderSchema(false),
};
exports.createUserSchema = joi_1.default.object({
    first_name: joi_1.default.string().max(100).required().messages({
        'string.base': 'first_name must be a string',
        'string.max': 'first_name must be less than 100 characters',
        'any.required': 'first_name is required',
    }),
    last_name: joi_1.default.string().max(100).required().messages({
        'string.base': 'last_name must be a string',
        'string.max': 'last_name must be less than 100 characters',
        'any.required': 'last_name is required',
    }),
    ...baseUserSchema,
    created_by: joi_1.default.number().integer().positive().optional().allow(null),
    role_ids: joi_1.default.array().items(joi_1.default.number().integer().positive()).optional().messages({
        'array.base': 'role_ids must be an array',
        'number.base': 'Each role_id must be a number',
        'number.positive': 'Each role_id must be positive',
    }),
});
exports.updateUserSchema = joi_1.default.object({
    first_name: joi_1.default.string().max(100).optional().min(1).messages({
        'string.base': 'first_name must be a string',
        'string.max': 'first_name must be less than 100 characters',
        'string.min': 'first_name cannot be empty',
        'any.empty': 'first_name cannot be empty',
    }),
    last_name: joi_1.default.string().max(100).optional().min(1).messages({
        'string.base': 'last_name must be a string',
        'string.max': 'last_name must be less than 100 characters',
        'string.min': 'last_name cannot be empty',
        'any.empty': 'last_name cannot be empty',
    }),
    birth_date: createBirthDateSchema(true),
    gender: createGenderSchema(true),
    updated_by: joi_1.default.number().integer().positive().optional().allow(null),
    role_ids: joi_1.default.array().items(joi_1.default.number().integer().positive()).optional().messages({
        'array.base': 'role_ids must be an array',
        'number.base': 'Each role_id must be a number',
        'number.positive': 'Each role_id must be positive',
    }),
});
exports.idParamSchema = joi_1.default.object({
    id: joi_1.default.number().integer().positive().required(),
});
exports.paginationQuerySchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1).optional(),
    limit: joi_1.default.number().integer().min(0).max(100).default(10).optional().messages({
        'number.min': 'limit must be 0 (no pagination) or between 1 and 100',
    }),
    search: joi_1.default.string().max(200).optional().allow(null, '').messages({
        'string.max': 'Search term must be less than 200 characters',
    }),
    first_name: joi_1.default.string().max(100).optional().allow(null, '').messages({
        'string.max': 'First name must be less than 100 characters',
    }),
    last_name: joi_1.default.string().max(100).optional().allow(null, '').messages({
        'string.max': 'Last name must be less than 100 characters',
    }),
    birth_date_from: joi_1.default.string().isoDate().optional().allow(null, '').messages({
        'string.isoDate': 'birth_date_from must be a valid ISO date',
    }),
    birth_date_to: joi_1.default.string().isoDate().optional().allow(null, '').messages({
        'string.isoDate': 'birth_date_to must be a valid ISO date',
    }),
    gender: joi_1.default.string()
        .valid(...Object.values(User_1.Gender))
        .optional()
        .allow(null, '')
        .messages({
        'any.only': `Gender must be one of: ${Object.values(User_1.Gender).join(', ')}`,
    }),
    include_deleted: joi_1.default.boolean().optional().default(false),
    fields: joi_1.default.string().allow(null, '').optional().messages({
        'string.base': 'fields must be a comma-separated string',
    }),
    include: joi_1.default.string().allow(null, '').optional().messages({
        'string.base': 'include must be a comma-separated string',
    }),
});
//# sourceMappingURL=uservalidation.js.map