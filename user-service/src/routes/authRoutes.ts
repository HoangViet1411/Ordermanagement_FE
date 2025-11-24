import { Router } from 'express';
import authController from '../controllers/authController';
import { validate } from '../middleware/validation';
import { signUpSchema, signInSchema } from '../validations/authValidation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Sign Up - VALIDATE BODY
router.post(
    '/signup',
    validate(signUpSchema),
    authController.signUp.bind(authController)
);

// Sign In - VALIDATE BODY
router.post(
    '/signin',
    validate(signInSchema),
    authController.signIn.bind(authController)
);

// Logout - AUTHENTICATE TOKEN
router.post(
    '/logout',
    authenticateToken,
    authController.logout.bind(authController)
);

export default router;