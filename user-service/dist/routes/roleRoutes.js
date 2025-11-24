"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleController_1 = __importDefault(require("../controllers/roleController"));
const validation_1 = require("../middleware/validation");
const roleValidation_1 = require("../validations/roleValidation");
const router = (0, express_1.Router)();
router.post('/', (0, validation_1.validate)(roleValidation_1.createRoleSchema), roleController_1.default.createRole.bind(roleController_1.default));
router.get('/', (0, validation_1.validateQuery)(roleValidation_1.paginationQuerySchema), roleController_1.default.getAllRoles.bind(roleController_1.default));
router.get('/:id', (0, validation_1.validateParams)(roleValidation_1.idParamSchema), roleController_1.default.getRoleById.bind(roleController_1.default));
router.put('/:id', (0, validation_1.validateParams)(roleValidation_1.idParamSchema), (0, validation_1.validate)(roleValidation_1.updateRoleSchema), roleController_1.default.updateRole.bind(roleController_1.default));
router.post('/:id/restore', (0, validation_1.validateParams)(roleValidation_1.idParamSchema), roleController_1.default.restoreRole.bind(roleController_1.default));
router.delete('/:id/hard', (0, validation_1.validateParams)(roleValidation_1.idParamSchema), roleController_1.default.hardDeleteRole.bind(roleController_1.default));
router.delete('/:id', (0, validation_1.validateParams)(roleValidation_1.idParamSchema), roleController_1.default.deleteRole.bind(roleController_1.default));
exports.default = router;
//# sourceMappingURL=roleRoutes.js.map