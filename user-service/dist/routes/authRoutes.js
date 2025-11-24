"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const validation_1 = require("../middleware/validation");
const authValidation_1 = require("../validations/authValidation");
const router = (0, express_1.Router)();
router.post('/signup', (0, validation_1.validate)(authValidation_1.signUpSchema), authController_1.default.signUp.bind(authController_1.default));
router.post('/signin', (0, validation_1.validate)(authValidation_1.signInSchema), authController_1.default.signIn.bind(authController_1.default));
exports.default = router;
//# sourceMappingURL=authRoutes.js.map