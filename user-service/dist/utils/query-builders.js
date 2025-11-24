"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAttributes = buildAttributes;
exports.buildProductAttributes = buildProductAttributes;
exports.buildInclude = buildInclude;
exports.buildSearchCondition = buildSearchCondition;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const USER_FIELD_WHITELIST = new Set([
    'id',
    'firstName',
    'lastName',
    'birthDate',
    'gender',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
]);
const PRODUCT_FIELD_WHITELIST = new Set([
    'id',
    'name',
    'price',
    'description',
    'quantity',
    'createdAt',
    'updatedAt',
    'deletedAt',
]);
const INCLUDE_MAP = {
    roles: {
        model: models_1.Role,
        as: 'roles',
        attributes: ['id', 'roleName'],
        required: true,
    },
};
function buildAttributes(fields, whitelist = USER_FIELD_WHITELIST) {
    if (!fields)
        return undefined;
    const list = fields
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const safe = list.filter((f) => whitelist.has(f));
    return safe.length > 0 ? safe : undefined;
}
function buildProductAttributes(fields) {
    return buildAttributes(fields, PRODUCT_FIELD_WHITELIST);
}
function buildInclude(include) {
    if (!include)
        return undefined;
    const tokens = include
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const includes = [];
    for (const token of tokens) {
        if (token === 'roles') {
            includes.push(INCLUDE_MAP.roles);
        }
    }
    return includes.length > 0 ? includes : undefined;
}
function buildSearchCondition(search) {
    const searchTerm = `%${search.trim()}%`;
    return {
        [sequelize_1.Op.or]: [
            (0, sequelize_1.where)((0, sequelize_1.fn)('CONCAT', (0, sequelize_1.col)('User.first_name'), ' ', (0, sequelize_1.col)('User.last_name')), { [sequelize_1.Op.like]: searchTerm }),
            { firstName: { [sequelize_1.Op.like]: searchTerm } },
            { lastName: { [sequelize_1.Op.like]: searchTerm } },
        ],
    };
}
//# sourceMappingURL=query-builders.js.map