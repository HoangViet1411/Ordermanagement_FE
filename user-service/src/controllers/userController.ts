import type { Request, Response } from 'express';
import userService from '../services/userService';
import type { CreateUserDto, UpdateUserDto } from '../types';
import { Gender } from '../models/User';

export class UserController {
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;
      const user = await userService.createUser(userData);
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: message || 'Failed to create user',
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;

      const user = await userService.getUserById(id);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Query parameters đã được validate, convert và set default bởi middleware
      // Sử dụng req.validatedQuery thay vì req.query
      const validatedQuery = req.validatedQuery || req.query;
      const page = (validatedQuery['page'] as unknown as number) ?? 1;
      const limit = (validatedQuery['limit'] as unknown as number) ?? 10;
      console.log('validatedQuery', validatedQuery);
      // Extract filter parameters (chỉ thêm vào object nếu có giá trị)
      const filters: {
        search?: string;
        first_name?: string;
        last_name?: string;
        birth_date_from?: string;
        birth_date_to?: string;
        gender?: Gender;
        include_deleted?: boolean;
        fields?: string;
        include?: string;
      } = {};

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
        // Validate gender là một trong các giá trị enum
        if (Object.values(Gender).includes(validatedQuery['gender'] as Gender)) {
          filters.gender = validatedQuery['gender'] as Gender;
        }
      }
      if (validatedQuery['include_deleted'] !== undefined) {
        filters.include_deleted =
          validatedQuery['include_deleted'] === true || validatedQuery['include_deleted'] === 'true';
      }
      // Dynamic query options
      if (validatedQuery['fields'] && typeof validatedQuery['fields'] === 'string') {
        filters.fields = validatedQuery['fields'];
      }
      if (validatedQuery['include'] && typeof validatedQuery['include'] === 'string') {
        filters.include = validatedQuery['include'];
      }

      // Check if include account info from Cognito
      const includeAccount = validatedQuery['includeAccount'] === 'true' || validatedQuery['includeAccount'] === true;

      const result = await userService.getAllUsers(page, limit, filters);
      
      // If includeAccount is true, enrich with Cognito account info
      let enrichedData = result.data;
      if (includeAccount) {
        const { cognitoAdminService } = await import('../services/cognitoAdminService');
        enrichedData = await Promise.all(
          result.data.map(async (user) => {
            if (user.cognitoUserId) {
              try {
                const cognitoInfo = await cognitoAdminService.getUserInfo(user.cognitoUserId);
                return {
                  ...user,
                  account: {
                    userId: cognitoInfo.userId,
                    email: cognitoInfo.email,
                    enabled: cognitoInfo.enabled,
                    userStatus: cognitoInfo.userStatus,
                  },
                };
              } catch (error) {
                // If Cognito user not found or error, return user without account info
                console.warn(`Failed to get Cognito info for user ${user.id}:`, error);
                return user;
              }
            }
            return user;
          })
        );
      }

      res.status(200).json({
        success: true,
        data: enrichedData,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get users';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
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

      // Only allow admin or user updating their own account
      if (!isAdmin && !isOwnAccount) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own account information.',
        });
        return;
      }

      const userData: UpdateUserDto = req.body;
      const user = await userService.updateUser(id, userData);

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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: message || 'Failed to update user',
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const deleted = await userService.deleteUser(id);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async hardDeleteUser(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const deleted = await userService.hardDeleteUser(id);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to hard delete user';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async restoreUser(req: Request, res: Response): Promise<void> {
    try {
      // ID đã được validate và convert sang number bởi middleware
      const id = req.params['id'] as unknown as number;
      const restored = await userService.restoreUser(id);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore user';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get current user's profile
   * Lấy cognito_user_id từ req.user.userId (từ token)
   * Trả về null nếu user chưa có profile
   */
  async getCurrentProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const cognitoUserId = req.user.userId;
      const user = await userService.getUserByCognitoUserId(cognitoUserId);
      
      if (!user) {
        // User chưa có profile
        res.status(200).json({
          success: true,
          data: null,
          message: 'Profile not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile retrieved successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get profile';
      console.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Create or update user profile
   * Lấy cognito_user_id từ req.user.userId (từ token)
   * Nếu user đã có profile → update, chưa có → create
   */
  async createOrUpdateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userData: CreateUserDto | UpdateUserDto = req.body;
      const cognitoUserId = req.user.userId; // Lấy từ token

      const user = await userService.createOrUpdateProfile(cognitoUserId, userData);
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile created/updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create/update profile';
      console.error('Error creating/updating profile:', error);
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export default new UserController();

