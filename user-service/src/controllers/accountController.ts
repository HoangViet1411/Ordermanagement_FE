import type { Request, Response } from 'express';
import { cognitoAdminService } from '../services/cognitoAdminService';
import userService from '../services/userService';

export class AccountController {
  /**
   * Get account info (email, status) from Cognito
   * GET /api/users/:id/account
   */
  async getAccountInfo(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      
      // Check if user is admin or viewing their own account
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userRoles = (currentUser.roles || []).map(r => r.toLowerCase());
      const isAdmin = userRoles.includes('admin');
      const isOwnAccount = currentUser.dbUserId === id;

      // Only allow admin or user viewing their own account
      if (!isAdmin && !isOwnAccount) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own account information.',
        });
        return;
      }
      
      // Get user from database to get cognitoUserId
      const user = await userService.getUserById(id);
      if (!user || !user.cognitoUserId) {
        res.status(404).json({
          success: false,
          message: 'User not found or no Cognito account',
        });
        return;
      }

      // Get info from Cognito
      const cognitoInfo = await cognitoAdminService.getUserInfo(user.cognitoUserId);
      
      res.status(200).json({
        success: true,
        data: {
          ...cognitoInfo,
          dbUserId: user.id,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get account info';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Reset user password (sends password reset code via email/SMS)
   * POST /api/users/:id/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      
      const user = await userService.getUserById(id);
      if (!user || !user.cognitoUserId) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const result = await cognitoAdminService.resetUserPassword(user.cognitoUserId);
      
      res.status(200).json({
        success: true,
        message: result.message || 'Password reset code sent to user email/SMS',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Set new password for user (admin sets password directly)
   * POST /api/users/:id/set-password
   */
  async setPassword(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      
      // Check if user is admin or updating their own account
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userRoles = (currentUser.roles || []).map(r => r.toLowerCase());
      const isAdmin = userRoles.includes('admin');
      const isOwnAccount = currentUser.dbUserId === id;

      // Only allow admin or user updating their own password
      if (!isAdmin && !isOwnAccount) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only change your own password.',
        });
        return;
      }

      const { password, permanent = true } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required',
        });
        return;
      }

      const user = await userService.getUserById(id);
      if (!user || !user.cognitoUserId) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      await cognitoAdminService.setUserPassword(user.cognitoUserId, password, permanent);
      
      res.status(200).json({
        success: true,
        message: 'Password set successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set password';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Update user email
   * PUT /api/users/:id/email
   */
  async updateEmail(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      
      // Check if user is admin or updating their own account
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userRoles = (currentUser.roles || []).map(r => r.toLowerCase());
      const isAdmin = userRoles.includes('admin');
      const isOwnAccount = currentUser.dbUserId === id;

      // Only allow admin or user updating their own email
      if (!isAdmin && !isOwnAccount) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own email.',
        });
        return;
      }

      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const user = await userService.getUserById(id);
      if (!user || !user.cognitoUserId) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      await cognitoAdminService.updateUserEmail(user.cognitoUserId, email);
      
      res.status(200).json({
        success: true,
        message: 'Email updated successfully. User needs to verify new email.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update email';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Disable user account
   * POST /api/users/:id/disable
   */
  async disableAccount(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      
      const user = await userService.getUserById(id);
      if (!user || !user.cognitoUserId) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      await cognitoAdminService.disableUser(user.cognitoUserId);
      
      res.status(200).json({
        success: true,
        message: 'Account disabled successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disable account';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Enable user account
   * POST /api/users/:id/enable
   */
  async enableAccount(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params['id'] as unknown as number;
      
      const user = await userService.getUserById(id);
      if (!user || !user.cognitoUserId) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      await cognitoAdminService.enableUser(user.cognitoUserId);
      
      res.status(200).json({
        success: true,
        message: 'Account enabled successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enable account';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export default new AccountController();

