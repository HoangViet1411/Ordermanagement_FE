"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const roleService_1 = __importDefault(require("../services/roleService"));
class RoleController {
    async createRole(req, res) {
        try {
            const roleData = req.body;
            const role = await roleService_1.default.createRole(roleData);
            res.status(201).json({
                success: true,
                data: role,
                message: 'Role created successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create role';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async getRoleById(req, res) {
        try {
            const id = req.params['id'];
            const role = await roleService_1.default.getRoleById(id);
            if (!role) {
                res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: role,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get role';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async getAllRoles(req, res) {
        try {
            const validatedQuery = req.validatedQuery || req.query;
            const page = validatedQuery['page'] ?? 1;
            const limit = validatedQuery['limit'] ?? 10;
            const filters = {};
            if (validatedQuery['search'] && typeof validatedQuery['search'] === 'string') {
                filters.search = validatedQuery['search'];
            }
            if (validatedQuery['role_name'] && typeof validatedQuery['role_name'] === 'string') {
                filters.role_name = validatedQuery['role_name'];
            }
            if (validatedQuery['include_deleted'] !== undefined) {
                filters.include_deleted =
                    validatedQuery['include_deleted'] === true || validatedQuery['include_deleted'] === 'true';
            }
            const result = await roleService_1.default.getAllRoles(page, limit, filters);
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get roles';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async updateRole(req, res) {
        try {
            const id = req.params['id'];
            const roleData = req.body;
            const role = await roleService_1.default.updateRole(id, roleData);
            if (!role) {
                res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: role,
                message: 'Role updated successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update role';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async deleteRole(req, res) {
        try {
            const id = req.params['id'];
            const deleted = await roleService_1.default.deleteRole(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Role deleted successfully (soft delete)',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete role';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async hardDeleteRole(req, res) {
        try {
            const id = req.params['id'];
            const deleted = await roleService_1.default.hardDeleteRole(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Role permanently deleted from database',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to hard delete role';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async restoreRole(req, res) {
        try {
            const id = req.params['id'];
            const restored = await roleService_1.default.restoreRole(id);
            if (!restored) {
                res.status(404).json({
                    success: false,
                    message: 'Role not found or not deleted',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Role restored successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to restore role';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
exports.RoleController = RoleController;
exports.default = new RoleController();
//# sourceMappingURL=roleController.js.map