"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const sequelize_1 = require("sequelize");
const Role_1 = __importDefault(require("../models/Role"));
class RoleService {
    async createRole(roleData) {
        const createData = {
            roleName: roleData.role_name,
        };
        if (roleData.description !== undefined) {
            createData.description = roleData.description;
        }
        const role = await Role_1.default.create(createData);
        return this.mapToRoleResponse(role);
    }
    async getRoleById(id) {
        const role = await Role_1.default.findByPk(id);
        return role ? this.mapToRoleResponse(role) : null;
    }
    async getAllRoles(page = 1, limit = 10, filters = {}) {
        const pageNumber = Math.max(1, page);
        const noPagination = limit === 0;
        const pageSize = noPagination ? 0 : Math.max(1, Math.min(100, limit));
        const offset = noPagination ? 0 : (pageNumber - 1) * pageSize;
        const whereConditions = [];
        if (filters.search && filters.search.trim()) {
            const searchTerm = `%${filters.search.trim()}%`;
            whereConditions.push({
                [sequelize_1.Op.or]: [
                    { roleName: { [sequelize_1.Op.like]: searchTerm } },
                    { description: { [sequelize_1.Op.like]: searchTerm } },
                ],
            });
        }
        if (filters.role_name && filters.role_name.trim()) {
            const roleNameFilter = filters.role_name.trim();
            whereConditions.push({
                roleName: { [sequelize_1.Op.like]: `%${roleNameFilter}%` },
            });
        }
        let whereClause;
        if (whereConditions.length === 1) {
            whereClause = whereConditions[0];
        }
        else if (whereConditions.length > 1) {
            whereClause = { [sequelize_1.Op.and]: whereConditions };
        }
        const queryOptions = {
            order: [['createdAt', 'ASC']],
            paranoid: filters.include_deleted === true ? false : true,
        };
        if (!noPagination) {
            queryOptions.limit = pageSize;
            queryOptions.offset = offset;
        }
        if (whereClause) {
            queryOptions.where = whereClause;
        }
        const { rows: roles, count: total } = await Role_1.default.findAndCountAll(queryOptions);
        const totalPages = noPagination ? 1 : Math.ceil(total / pageSize);
        const responseLimit = noPagination ? total : pageSize;
        return {
            data: roles.map((role) => this.mapToRoleResponse(role)),
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
    async updateRole(id, roleData) {
        const role = await Role_1.default.findByPk(id);
        if (!role) {
            return null;
        }
        const updateData = {};
        if (roleData.role_name !== undefined && roleData.role_name !== null && roleData.role_name.trim().length > 0) {
            updateData.roleName = roleData.role_name.trim();
        }
        if (roleData.description !== undefined) {
            updateData.description = roleData.description;
        }
        await role.update(updateData);
        return this.mapToRoleResponse(role);
    }
    async deleteRole(id) {
        const role = await Role_1.default.findByPk(id);
        if (!role) {
            return false;
        }
        await role.destroy();
        return true;
    }
    async hardDeleteRole(id) {
        const role = await Role_1.default.findByPk(id, { paranoid: false });
        if (!role) {
            return false;
        }
        await role.destroy({ force: true });
        return true;
    }
    async restoreRole(id) {
        const role = await Role_1.default.findByPk(id, { paranoid: false });
        if (!role) {
            return false;
        }
        if (!role.deletedAt) {
            return false;
        }
        await role.restore();
        return true;
    }
    mapToRoleResponse(role) {
        return role.get({ plain: true });
    }
}
exports.RoleService = RoleService;
exports.default = new RoleService();
//# sourceMappingURL=roleService.js.map