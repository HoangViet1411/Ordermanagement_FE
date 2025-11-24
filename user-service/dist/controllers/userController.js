"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userService_1 = __importDefault(require("../services/userService"));
const User_1 = require("../models/User");
class UserController {
    async createUser(req, res) {
        try {
            const userData = req.body;
            const user = await userService_1.default.createUser(userData);
            res.status(201).json({
                success: true,
                data: user,
                message: 'User created successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create user';
            console.error('Error creating user:', error);
            res.status(500).json({
                success: false,
                message: message || 'Failed to create user',
            });
        }
    }
    async getUserById(req, res) {
        try {
            const id = req.params['id'];
            const user = await userService_1.default.getUserById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get user';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async getAllUsers(req, res) {
        try {
            const validatedQuery = req.validatedQuery || req.query;
            const page = validatedQuery['page'] ?? 1;
            const limit = validatedQuery['limit'] ?? 10;
            console.log('validatedQuery', validatedQuery);
            const filters = {};
            if (validatedQuery['search'] && typeof validatedQuery['search'] === 'string') {
                filters.search = validatedQuery['search'];
            }
            if (validatedQuery['first_name'] && typeof validatedQuery['first_name'] === 'string') {
                filters.first_name = validatedQuery['first_name'];
            }
            if (validatedQuery['last_name'] && typeof validatedQuery['last_name'] === 'string') {
                filters.last_name = validatedQuery['last_name'];
            }
            if (validatedQuery['birth_date_from'] && typeof validatedQuery['birth_date_from'] === 'string') {
                filters.birth_date_from = validatedQuery['birth_date_from'];
            }
            if (validatedQuery['birth_date_to'] && typeof validatedQuery['birth_date_to'] === 'string') {
                filters.birth_date_to = validatedQuery['birth_date_to'];
            }
            if (validatedQuery['gender'] && typeof validatedQuery['gender'] === 'string') {
                if (Object.values(User_1.Gender).includes(validatedQuery['gender'])) {
                    filters.gender = validatedQuery['gender'];
                }
            }
            if (validatedQuery['include_deleted'] !== undefined) {
                filters.include_deleted =
                    validatedQuery['include_deleted'] === true || validatedQuery['include_deleted'] === 'true';
            }
            if (validatedQuery['fields'] && typeof validatedQuery['fields'] === 'string') {
                filters.fields = validatedQuery['fields'];
            }
            if (validatedQuery['include'] && typeof validatedQuery['include'] === 'string') {
                filters.include = validatedQuery['include'];
            }
            const result = await userService_1.default.getAllUsers(page, limit, filters);
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get users';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async updateUser(req, res) {
        try {
            const id = req.params['id'];
            const userData = req.body;
            const user = await userService_1.default.updateUser(id, userData);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: user,
                message: 'User updated successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update user';
            console.error('Error updating user:', error);
            res.status(500).json({
                success: false,
                message: message || 'Failed to update user',
            });
        }
    }
    async deleteUser(req, res) {
        try {
            const id = req.params['id'];
            const deleted = await userService_1.default.deleteUser(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'User deleted successfully (soft delete)',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete user';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async hardDeleteUser(req, res) {
        try {
            const id = req.params['id'];
            const deleted = await userService_1.default.hardDeleteUser(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'User permanently deleted from database',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to hard delete user';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async restoreUser(req, res) {
        try {
            const id = req.params['id'];
            const restored = await userService_1.default.restoreUser(id);
            if (!restored) {
                res.status(404).json({
                    success: false,
                    message: 'User not found or not deleted',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'User restored successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to restore user';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
exports.UserController = UserController;
exports.default = new UserController();
//# sourceMappingURL=userController.js.map