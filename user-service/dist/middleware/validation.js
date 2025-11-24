"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateParams = exports.validate = void 0;
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors,
            });
            return;
        }
        req.body = value;
        next();
    };
};
exports.validate = validate;
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            convert: true,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            res.status(400).json({
                success: false,
                message: 'Invalid parameters',
                errors,
            });
            return;
        }
        if (value.id && typeof value.id === 'string') {
            value.id = Number.parseInt(value.id, 10);
        }
        req.params = value;
        next();
    };
};
exports.validateParams = validateParams;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            convert: true,
            allowUnknown: true,
            stripUnknown: false,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors,
            });
            return;
        }
        req.validatedQuery = value;
        next();
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validation.js.map