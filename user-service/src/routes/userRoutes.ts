import { Router } from 'express';
import userController from '../controllers/userController';
import accountController from '../controllers/accountController';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createUserSchema, updateUserSchema, idParamSchema, paginationQuerySchema } from '../validations/uservalidation';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validateProfile } from '../middleware/profileValidation';

const router = Router();

// Get current user's profile - AUTHENTICATE TOKEN
router.get(
  '/profile',
  authenticateToken,
  userController.getCurrentProfile.bind(userController)
);

// Create or update profile - AUTHENTICATE TOKEN + VALIDATE BODY
// User tự tạo/update profile của mình sau khi signup
// Validation sẽ tự động chọn schema phù hợp (create vs update)
router.post(
  '/profile',
  authenticateToken,
  validateProfile,
  userController.createOrUpdateProfile.bind(userController)
);

// Create a new user - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE BODY
router.post(
  '/',
  authenticateToken,
  requirePermission(['admin']),
  validate(createUserSchema),
  userController.createUser.bind(userController)
);

// Get all users - AUTHENTICATE TOKEN + VALIDATE QUERY
router.get(
  '/',
  authenticateToken,
  validateQuery(paginationQuerySchema), // Dynamic attributes/includes support
  userController.getAllUsers.bind(userController)
);

// Get user by ID - AUTHENTICATE TOKEN + VALIDATE PARAMS
router.get(
  '/:id',
  authenticateToken,
  validateParams(idParamSchema),
  userController.getUserById.bind(userController)
);

// Update user by ID - AUTHENTICATE TOKEN + ADMIN OR OWN USER + VALIDATE PARAMS + BODY
router.put(
  '/:id',
  authenticateToken,
  validateParams(idParamSchema),
  validate(updateUserSchema),
  userController.updateUser.bind(userController)
);

// Restore user by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.post(
  '/:id/restore',
  authenticateToken,
  requirePermission(['admin']),
  validateParams(idParamSchema),
  userController.restoreUser.bind(userController)
);

// Hard delete user by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id/hard',
  authenticateToken,
  requirePermission(['admin']),
  validateParams(idParamSchema),
  userController.hardDeleteUser.bind(userController)
);

// Soft delete user by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id',
  authenticateToken,
  requirePermission(['admin']),
  validateParams(idParamSchema),
  userController.deleteUser.bind(userController)
);

// Get account info from Cognito - AUTHENTICATE TOKEN + ADMIN OR OWN USER + VALIDATE PARAMS
router.get(
  '/:id/account',
  authenticateToken,
  validateParams(idParamSchema),
  accountController.getAccountInfo.bind(accountController)
);

// Reset user password - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.post(
  '/:id/reset-password',
  authenticateToken,
  requirePermission(['admin']),
  validateParams(idParamSchema),
  accountController.resetPassword.bind(accountController)
);

// Set user password - AUTHENTICATE TOKEN + ADMIN OR OWN USER + VALIDATE PARAMS
router.post(
  '/:id/set-password',
  authenticateToken,
  validateParams(idParamSchema),
  accountController.setPassword.bind(accountController)
);

// Update user email - AUTHENTICATE TOKEN + ADMIN OR OWN USER + VALIDATE PARAMS
router.put(
  '/:id/email',
  authenticateToken,
  validateParams(idParamSchema),
  accountController.updateEmail.bind(accountController)
);

// Disable user account - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.post(
  '/:id/disable',
  authenticateToken,
  requirePermission(['admin']),
  validateParams(idParamSchema),
  accountController.disableAccount.bind(accountController)
);

// Enable user account - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.post(
  '/:id/enable',
  authenticateToken,
  requirePermission(['admin']),
  validateParams(idParamSchema),
  accountController.enableAccount.bind(accountController)
);

export default router;