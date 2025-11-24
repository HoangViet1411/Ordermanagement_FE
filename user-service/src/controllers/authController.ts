import type { Request, Response } from 'express';
import { authService } from '../services/authService';

export class AuthController {
    async signUp(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const user = await authService.signUp({ email, password });
            res.status(201).json({
                success: true,
                data: user,
                message: 'User created successfully',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to sign up';
            console.error('Error signing up:', error);
            res.status(500).json({
                success: false,
                message,
            });
        }
    }

    async signIn(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const tokens = await authService.signIn({ email, password });
            res.status(200).json({
                success: true,
                data: tokens,
                message: 'User signed in successfully',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to sign in';
            console.error('Error signing in:', error);
            res.status(401).json({
                success: false,
                message,
            });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            // Access token được lấy từ middleware authenticateToken
            // Nó được attach vào req.user hoặc req.headers
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    success: false,
                    message: 'No token provided',
                });
                return;
            }

            const accessToken = authHeader.substring(7);
            await authService.logout(accessToken);

            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to logout';
            console.error('Error logging out:', error);
            res.status(500).json({
                success: false,
                message,
            });
        }
    }

}

export default new AuthController();