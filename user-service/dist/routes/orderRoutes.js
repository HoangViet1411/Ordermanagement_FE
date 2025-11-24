"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = __importDefault(require("../controllers/orderController"));
const validation_1 = require("../middleware/validation");
const orderValidation_1 = require("../validations/orderValidation");
const uservalidation_1 = require("../validations/uservalidation");
const router = (0, express_1.Router)();
router.post('/', (0, validation_1.validate)(orderValidation_1.createOrderSchema), orderController_1.default.createOrder.bind(orderController_1.default));
router.get('/', (0, validation_1.validateQuery)(uservalidation_1.paginationQuerySchema), orderController_1.default.getAllOrders.bind(orderController_1.default));
router.get('/:id', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), orderController_1.default.getOrderById.bind(orderController_1.default));
router.put('/:id', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), (0, validation_1.validate)(orderValidation_1.updateOrderSchema), orderController_1.default.updateOrder.bind(orderController_1.default));
router.post('/:id/restore', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), orderController_1.default.restoreOrder.bind(orderController_1.default));
router.delete('/:id/hard', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), orderController_1.default.hardDeleteOrder.bind(orderController_1.default));
router.delete('/:id', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), orderController_1.default.deleteOrder.bind(orderController_1.default));
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map