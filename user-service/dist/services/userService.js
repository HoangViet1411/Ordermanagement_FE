"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const sequelize_1 = require("sequelize");
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const UserRole_1 = __importDefault(require("../models/UserRole"));
const transactionContext_1 = require("../config/transactionContext");
const Transactional_1 = require("../decorators/Transactional");
const query_builders_1 = require("../utils/query-builders");
class UserService {
    async createUser(userData) {
        const user = await User_1.default.create({
            firstName: userData.first_name,
            lastName: userData.last_name,
            birthDate: userData.birth_date ? new Date(userData.birth_date) : null,
            gender: userData.gender ?? null,
            createdBy: userData.created_by ?? null,
        });
        if (process.env['TEST_TRANSACTION'] === 'true') {
            throw new Error('Test transaction rollback - User should not be created');
        }
        const roleIds = userData.role_ids;
        if (!roleIds || roleIds.length === 0) {
            throw new Error('role_ids is required and must contain at least one role');
        }
        const uniqueRoleIds = [...new Set(roleIds)];
        const roles = await Role_1.default.findAll({
            where: { id: uniqueRoleIds },
        });
        if (roles.length !== uniqueRoleIds.length) {
            const foundRoleIds = roles.map((r) => r.id);
            const missingRoleIds = uniqueRoleIds.filter((id) => !foundRoleIds.includes(id));
            throw new Error(`Roles with IDs [${missingRoleIds.join(', ')}] not found`);
        }
        const now = new Date();
        await UserRole_1.default.bulkCreate(roles.map((role) => ({
            userId: user.id,
            roleId: role.id,
            createdAt: now,
            updatedAt: now,
        })));
        const userWithRoles = await User_1.default.findByPk(user.id, {
            attributes: ['id', 'firstName', 'lastName', 'birthDate', 'gender'],
            include: [{
                    model: Role_1.default,
                    as: 'roles',
                    required: true,
                    attributes: ['id', 'roleName'],
                }],
        });
        if (!userWithRoles) {
            throw new Error('User created but could not be retrieved');
        }
        return this.mapToUserResponse(userWithRoles);
    }
    async getUserById(id) {
        const user = await User_1.default.findByPk(id, {
            attributes: ['id', 'firstName', 'lastName', 'birthDate', 'gender'],
            include: [{
                    model: Role_1.default,
                    as: 'roles',
                    required: true,
                    attributes: ['id', 'roleName'],
                }],
        });
        return user ? this.mapToUserResponse(user) : null;
    }
    async getAllUsers(page = 1, limit = 10, filters = {}) {
        const pageNumber = Math.max(1, page);
        const noPagination = limit === 0;
        const pageSize = noPagination ? 0 : Math.max(1, Math.min(100, limit));
        const offset = noPagination ? 0 : (pageNumber - 1) * pageSize;
        const whereConditions = [];
        if (filters.search && filters.search.trim()) {
            whereConditions.push((0, query_builders_1.buildSearchCondition)(filters.search));
        }
        if (filters.first_name && filters.first_name.trim()) {
            const firstNameFilter = filters.first_name.trim();
            const firstNameCondition = { firstName: { [sequelize_1.Op.like]: `%${firstNameFilter}%` } };
            whereConditions.push(firstNameCondition);
        }
        if (filters.last_name && filters.last_name.trim()) {
            const lastNameFilter = filters.last_name.trim();
            const lastNameCondition = { lastName: { [sequelize_1.Op.like]: `%${lastNameFilter}%` } };
            whereConditions.push(lastNameCondition);
        }
        if (filters.birth_date_from && filters.birth_date_from.trim()) {
            const fromDate = new Date(filters.birth_date_from);
            whereConditions.push({
                birthDate: {
                    [sequelize_1.Op.gte]: fromDate,
                },
            });
        }
        if (filters.birth_date_to && filters.birth_date_to.trim()) {
            const toDate = new Date(filters.birth_date_to);
            toDate.setHours(23, 59, 59, 999);
            whereConditions.push({
                birthDate: {
                    [sequelize_1.Op.lte]: toDate,
                },
            });
        }
        if (filters.gender) {
            whereConditions.push({
                gender: filters.gender,
            });
        }
        let whereClause;
        if (whereConditions.length === 1) {
            whereClause = whereConditions[0];
        }
        else if (whereConditions.length > 1) {
            whereClause = { [sequelize_1.Op.and]: whereConditions };
        }
        const attributes = (0, query_builders_1.buildAttributes)(filters.fields);
        const includeDefs = (0, query_builders_1.buildInclude)(filters.include);
        const queryOptions = {
            order: [['id', 'DESC']],
            paranoid: filters.include_deleted === true ? false : true,
            distinct: true,
        };
        if (attributes) {
            queryOptions.attributes = attributes;
        }
        if (includeDefs) {
            queryOptions.include = includeDefs;
            queryOptions.include = queryOptions.include.map((inc) => {
                if (inc.model === Role_1.default || (inc.as && inc.as === 'roles')) {
                    return { ...inc, required: true };
                }
                return inc;
            });
        }
        else {
            queryOptions.include = [{
                    model: Role_1.default,
                    as: 'roles',
                    required: true,
                    attributes: ['id', 'roleName'],
                }];
        }
        if (!noPagination) {
            queryOptions.limit = pageSize;
            queryOptions.offset = offset;
        }
        if (whereClause) {
            queryOptions.where = whereClause;
        }
        const { rows: users, count: total } = await User_1.default.findAndCountAll(queryOptions);
        const totalPages = noPagination ? 1 : Math.ceil(total / pageSize);
        const responseLimit = noPagination ? total : pageSize;
        return {
            data: users.map((user) => this.mapToUserResponse(user)),
            pagination: noPagination
                ? {
                    page: 1,
                    limit: total,
                    total,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                }
                : {
                    page: pageNumber,
                    limit: responseLimit,
                    total,
                    totalPages,
                    hasNext: pageNumber < totalPages,
                    hasPrev: pageNumber > 1,
                },
        };
    }
    async updateUser(id, userData, opts) {
        if (opts?.transaction) {
            return (0, transactionContext_1.withExistingTransaction)(opts.transaction, async (t) => {
                return this._updateUserInternal(id, userData, t);
            }).catch((error) => {
                if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
                    return null;
                }
                throw error;
            });
        }
        return this._updateUserWithTransaction(id, userData).catch((error) => {
            if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
                return null;
            }
            throw error;
        });
    }
    async _updateUserWithTransaction(id, userData) {
        const transaction = (0, transactionContext_1.getTransaction)();
        if (!transaction) {
            throw new Error('Transaction not found in CLS namespace');
        }
        return this._updateUserInternal(id, userData, transaction);
    }
    async _updateUserInternal(id, userData, _t) {
        const user = await User_1.default.findByPk(id);
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }
        const updateData = {};
        if (userData.first_name !== undefined && userData.first_name !== null && userData.first_name.trim().length > 0) {
            updateData.firstName = userData.first_name.trim();
        }
        if (userData.last_name !== undefined && userData.last_name !== null && userData.last_name.trim().length > 0) {
            updateData.lastName = userData.last_name.trim();
        }
        if (userData.birth_date !== undefined) {
            updateData.birthDate = userData.birth_date ? new Date(userData.birth_date) : null;
        }
        if (userData.gender !== undefined) {
            updateData.gender = userData.gender;
        }
        if (userData.updated_by !== undefined) {
            updateData.updatedBy = userData.updated_by;
        }
        if (Object.keys(updateData).length > 0) {
            await user.update(updateData, {
                fields: Object.keys(updateData),
            });
        }
        if (userData.role_ids !== undefined) {
            await UserRole_1.default.destroy({
                where: { userId: user.id },
            });
            if (userData.role_ids.length > 0) {
                const uniqueRoleIds = [...new Set(userData.role_ids)];
                const roles = await Role_1.default.findAll({
                    where: { id: uniqueRoleIds },
                });
                if (roles.length !== uniqueRoleIds.length) {
                    const foundRoleIds = roles.map((r) => r.id);
                    const missingRoleIds = uniqueRoleIds.filter((id) => !foundRoleIds.includes(id));
                    throw new Error(`Roles with IDs [${missingRoleIds.join(', ')}] not found`);
                }
                const now = new Date();
                await UserRole_1.default.bulkCreate(roles.map((role) => ({
                    userId: user.id,
                    roleId: role.id,
                    createdAt: now,
                    updatedAt: now,
                })));
            }
        }
        const updatedUser = await User_1.default.findByPk(user.id, {
            attributes: ['id', 'firstName', 'lastName', 'birthDate', 'gender'],
            include: [{
                    model: Role_1.default,
                    as: 'roles',
                    required: true,
                    attributes: ['id', 'roleName'],
                }],
        });
        if (!updatedUser) {
            throw new Error('User updated but could not be retrieved');
        }
        return this.mapToUserResponse(updatedUser);
    }
    async deleteUser(id) {
        const user = await User_1.default.findByPk(id, {
            attributes: ['id'],
        });
        if (!user) {
            return false;
        }
        await user.destroy();
        return true;
    }
    async hardDeleteUser(id) {
        const user = await User_1.default.findByPk(id, {
            paranoid: false,
            attributes: ['id'],
        });
        if (!user) {
            return false;
        }
        await user.destroy({ force: true });
        return true;
    }
    async restoreUser(id) {
        const user = await User_1.default.findByPk(id, {
            paranoid: false,
            attributes: ['id', 'deletedAt'],
        });
        if (!user) {
            return false;
        }
        if (!user.deletedAt) {
            return false;
        }
        await user.restore();
        return true;
    }
    mapToUserResponse(user) {
        const plainUser = user.get({ plain: true });
        return {
            ...plainUser,
            roles: plainUser.roles && Array.isArray(plainUser.roles)
                ? plainUser.roles.map((role) => ({
                    id: role.id,
                    roleName: role.roleName,
                }))
                : [],
        };
    }
}
exports.UserService = UserService;
__decorate([
    (0, Transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserService.prototype, "createUser", null);
__decorate([
    (0, Transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UserService.prototype, "_updateUserWithTransaction", null);
exports.default = new UserService();
//# sourceMappingURL=userService.js.map