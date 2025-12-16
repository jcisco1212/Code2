import { Router, RequestHandler } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

// Cast middleware and handlers to RequestHandler to avoid TypeScript conflicts
const auth = authenticate as RequestHandler;

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
  authController.register as RequestHandler
);

// Login
router.post(
  '/login',
  validate([
    body('identifier').notEmpty().withMessage('Email or username required'),
    body('password').notEmpty().withMessage('Password required')
  ]),
  authController.login as RequestHandler
);

// Verify 2FA token
router.post(
  '/verify-2fa',
  validate([
    body('userId').isUUID().withMessage('Valid user ID required'),
    body('token').isLength({ min: 6, max: 6 }).withMessage('6-digit token required')
  ]),
  authController.verify2FA as RequestHandler
);

// Refresh access token
router.post(
  '/refresh-token',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token required')
  ]),
  authController.refreshToken as RequestHandler
);

// Logout
router.post('/logout', auth, authController.logout as RequestHandler);

// Request email verification
router.post('/resend-verification', auth, authController.resendVerification as RequestHandler);

// Verify email with token
router.get(
  '/verify-email',
  validate([
    query('token').notEmpty().withMessage('Verification token required')
  ]),
  authController.verifyEmail as RequestHandler
);

// Request password reset
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ]),
  authController.forgotPassword as RequestHandler
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
  authController.resetPassword as RequestHandler
);

// Enable 2FA - Step 1: Generate secret
router.post('/2fa/enable', auth, authController.enable2FA as RequestHandler);

// Enable 2FA - Step 2: Verify and confirm
router.post(
  '/2fa/confirm',
  auth,
  validate([
    body('token').isLength({ min: 6, max: 6 }).withMessage('6-digit token required')
  ]),
  authController.confirm2FA as RequestHandler
);

// Disable 2FA
router.post(
  '/2fa/disable',
  auth,
  validate([
    body('password').notEmpty().withMessage('Password required'),
    body('token').isLength({ min: 6, max: 6 }).withMessage('6-digit token required')
  ]),
  authController.disable2FA as RequestHandler
);

// Change password
router.post(
  '/change-password',
  auth,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special char')
  ]),
  authController.changePassword as RequestHandler
);

// Get current user
router.get('/me', auth, authController.getCurrentUser as RequestHandler);

export default router;
