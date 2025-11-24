"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const authService_1 = require("../services/authService");
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required',
            });
            return;
        }
        const user = await authService_1.authService.verifyToken(token);
        req.user = user;
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        console.error('Error authenticating token:', error);
        res.status(401).json({
            success: false,
            message,
        });
    }
}
//# sourceMappingURL=auth.js.map