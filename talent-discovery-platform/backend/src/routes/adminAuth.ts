import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { authenticateAdmin } from '../middleware/adminAuth';
import {
  adminLogin,
  adminVerify2FA,
  adminRefreshToken,
  adminLogout,
  getAdminSession,
  adminSetup2FA,
  adminConfirm2FA,
  adminDisable2FA
} from '../controllers/adminAuthController';

const router = Router();

// Strict rate limiting for admin authentication endpoints
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // Count all requests, not just failures
});

// Even stricter limiter for 2FA attempts
const admin2FALimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts per window
  message: {
    error: 'Too many 2FA attempts. Please try again in 5 minutes.',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   POST /api/v1/admin/auth/login
 * @desc    Admin login - separate authentication flow from regular users
 * @access  Public (but only admin/super_admin users can authenticate)
 */
router.post(
  '/login',
  adminAuthLimiter,
  validate([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]),
  adminLogin as RequestHandler
);

/**
 * @route   POST /api/v1/admin/auth/verify-2fa
 * @desc    Verify 2FA code to complete admin login
 * @access  Public (requires temp token from login)
 */
router.post(
  '/verify-2fa',
  admin2FALimiter,
  validate([
    body('tempToken')
      .notEmpty()
      .withMessage('Temporary token is required'),
    body('token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Valid 6-digit 2FA code is required')
  ]),
  adminVerify2FA as RequestHandler
);

/**
 * @route   POST /api/v1/admin/auth/refresh
 * @desc    Refresh admin access token
 * @access  Public (requires valid refresh token)
 */
router.post(
  '/refresh',
  validate([
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ]),
  adminRefreshToken as RequestHandler
);

/**
 * @route   POST /api/v1/admin/auth/logout
 * @desc    Admin logout - invalidate admin session
 * @access  Private (admin)
 */
router.post(
  '/logout',
  authenticateAdmin as RequestHandler,
  adminLogout as RequestHandler
);

/**
 * @route   GET /api/v1/admin/auth/session
 * @desc    Get current admin session info
 * @access  Private (admin)
 */
router.get(
  '/session',
  authenticateAdmin as RequestHandler,
  getAdminSession as RequestHandler
);

/**
 * @route   POST /api/v1/admin/auth/2fa/setup
 * @desc    Setup 2FA for admin account (optional)
 * @access  Private (admin)
 */
router.post(
  '/2fa/setup',
  authenticateAdmin as RequestHandler,
  adminSetup2FA as RequestHandler
);

/**
 * @route   POST /api/v1/admin/auth/2fa/confirm
 * @desc    Confirm 2FA setup with verification code
 * @access  Private (admin)
 */
router.post(
  '/2fa/confirm',
  authenticateAdmin as RequestHandler,
  validate([
    body('token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Valid 6-digit verification code is required')
  ]),
  adminConfirm2FA as RequestHandler
);

/**
 * @route   POST /api/v1/admin/auth/2fa/disable
 * @desc    Disable 2FA for admin account
 * @access  Private (admin)
 */
router.post(
  '/2fa/disable',
  authenticateAdmin as RequestHandler,
  validate([
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Valid 6-digit 2FA code is required')
  ]),
  adminDisable2FA as RequestHandler
);

export default router;
