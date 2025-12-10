import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

// Register new user
router.post(
  '/register',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('username')
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-50 characters, alphanumeric and underscores only'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special char'),
    body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('First name required'),
    body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('Last name required'),
    body('role').optional().isIn(['user', 'creator', 'agent']).withMessage('Invalid role')
  ]),
  authController.register
);

// Login
router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ]),
  authController.login
);

// Verify 2FA token
router.post(
  '/verify-2fa',
  validate([
    body('userId').isUUID().withMessage('Valid user ID required'),
    body('token').isLength({ min: 6, max: 6 }).withMessage('6-digit token required')
  ]),
  authController.verify2FA
);

// Refresh access token
router.post(
  '/refresh-token',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token required')
  ]),
  authController.refreshToken
);

// Logout
router.post('/logout', authenticate, authController.logout);

// Request email verification
router.post('/resend-verification', authenticate, authController.resendVerification);

// Verify email with token
router.get(
  '/verify-email',
  validate([
    query('token').notEmpty().withMessage('Verification token required')
  ]),
  authController.verifyEmail
);

// Request password reset
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ]),
  authController.forgotPassword
);

// Reset password with token
router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Reset token required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special char')
  ]),
  authController.resetPassword
);

// Enable 2FA - Step 1: Generate secret
router.post('/2fa/enable', authenticate, authController.enable2FA);

// Enable 2FA - Step 2: Verify and confirm
router.post(
  '/2fa/confirm',
  authenticate,
  validate([
    body('token').isLength({ min: 6, max: 6 }).withMessage('6-digit token required')
  ]),
  authController.confirm2FA
);

// Disable 2FA
router.post(
  '/2fa/disable',
  authenticate,
  validate([
    body('password').notEmpty().withMessage('Password required'),
    body('token').isLength({ min: 6, max: 6 }).withMessage('6-digit token required')
  ]),
  authController.disable2FA
);

// Change password
router.post(
  '/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special char')
  ]),
  authController.changePassword
);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
