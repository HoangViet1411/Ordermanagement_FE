"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = __importDefault(require("../controllers/productController"));
const validation_1 = require("../middleware/validation");
const productValidation_1 = require("../validations/productValidation");
const uservalidation_1 = require("../validations/uservalidation");
const router = (0, express_1.Router)();
router.post('/', (0, validation_1.validate)(productValidation_1.createProductSchema), productController_1.default.createProduct.bind(productController_1.default));
router.get('/', (0, validation_1.validateQuery)(uservalidation_1.paginationQuerySchema), productController_1.default.getAllProducts.bind(productController_1.default));
router.get('/:id', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), productController_1.default.getProductById.bind(productController_1.default));
router.put('/:id', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), (0, validation_1.validate)(productValidation_1.updateProductSchema), productController_1.default.updateProduct.bind(productController_1.default));
router.post('/:id/restore', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), productController_1.default.restoreProduct.bind(productController_1.default));
router.delete('/:id/hard', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), productController_1.default.hardDeleteProduct.bind(productController_1.default));
router.delete('/:id', (0, validation_1.validateParams)(uservalidation_1.idParamSchema), productController_1.default.deleteProduct.bind(productController_1.default));
exports.default = router;
//# sourceMappingURL=productRoutes.js.map