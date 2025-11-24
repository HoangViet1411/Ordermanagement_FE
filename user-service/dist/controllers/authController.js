"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
class AuthController {
    async signUp(req, res) {
        try {
            const { email, password } = req.body;
            const user = await authService_1.authService.signUp({ email, password });
            res.status(201).json({
                success: true,
                data: user,
                message: 'User created successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to sign up';
            console.error('Error signing up:', error);
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async signIn(req, res) {
        try {
            const { email, password } = req.body;
            const tokens = await authService_1.authService.signIn({ email, password });
            res.status(200).json({
                success: true,
                data: tokens,
                message: 'User signed in successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to sign in';
            console.error('Error signing in:', error);
            res.status(401).json({
                success: false,
                message,
            });
        }
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
//# sourceMappingURL=authController.js.map