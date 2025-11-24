"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = __importDefault(require("../controllers/userController"));
const validation_1 = require("../middleware/validation");
const uservalidation_1 = require("../validations/uservalidation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticateToken, (0, validation_1.validate)(uservalidation_1.createUserSchema), userController_1.default.createUser.bind(userController_1.default));
router.get('/', auth_1.authenticateToken, (0, validation_1.validateQuery)(uservalidation_1.paginationQuerySchema), userController_1.default.getAllUsers.bind(userController_1.default));
router.get('/:id', auth_1.authenticateToken, (0, validation_1.validateParams)(uservalidation_1.idParamSchema), userController_1.default.getUserById.bind(userController_1.default));
router.put('/:id', auth_1.authenticateToken, (0, validation_1.validateParams)(uservalidation_1.idParamSchema), (0, validation_1.validate)(uservalidation_1.updateUserSchema), userController_1.default.updateUser.bind(userController_1.default));
router.post('/:id/restore', auth_1.authenticateToken, (0, validation_1.validateParams)(uservalidation_1.idParamSchema), userController_1.default.restoreUser.bind(userController_1.default));
router.delete('/:id/hard', auth_1.authenticateToken, (0, validation_1.validateParams)(uservalidation_1.idParamSchema), userController_1.default.hardDeleteUser.bind(userController_1.default));
router.delete('/:id', auth_1.authenticateToken, (0, validation_1.validateParams)(uservalidation_1.idParamSchema), userController_1.default.deleteUser.bind(userController_1.default));
exports.default = router;
//# sourceMappingURL=userRoutes.js.map