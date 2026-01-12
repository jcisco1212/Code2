import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models';
import { logger } from '../utils/logger';
import { AuthRequest, JWTPayload } from './auth';

// Admin-specific JWT secrets (separate from regular user auth)
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'default-admin-secret';

// Extended payload for admin sessions
export interface AdminJWTPayload extends JWTPayload {
  isAdminSession: boolean;
  twoFactorVerified?: boolean;
}

export interface AdminAuthRequest extends AuthRequest {
  isAdminSession?: boolean;
  twoFactorVerified?: boolean;
}

/**
 * Authenticate admin JWT token
 * This middleware validates tokens issued specifically for admin sessions
 * using a separate JWT secret from regular user authentication
 */
export const authenticateAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: { message: 'Admin authentication required' } });
      return;
    }

    const token = authHeader.substring(7);

    // Verify using admin-specific secret
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminJWTPayload;

    // Verify this is an admin session token
    if (!decoded.isAdminSession) {
      res.status(401).json({ error: { message: 'Invalid admin session. Please login through the admin portal.' } });
      return;
    }

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      res.status(401).json({ error: { message: 'User not found' } });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: { message: 'Account is disabled' } });
      return;
    }

    // Verify user still has admin privileges
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({ error: { message: 'Admin access revoked' } });
      return;
    }

    // Attach user and admin session info to request
    (req as AdminAuthRequest).user = user;
    (req as AdminAuthRequest).userId = user.id;
    (req as AdminAuthRequest).isAdminSession = true;
    (req as AdminAuthRequest).twoFactorVerified = decoded.twoFactorVerified || false;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: { message: 'Admin session expired' } });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: { message: 'Invalid admin token' } });
      return;
    }
    logger.error('Admin authentication error:', error);
    res.status(500).json({ error: { message: 'Admin authentication failed' } });
  }
};

/**
 * Require 2FA to be verified for sensitive admin operations
 * Use this after authenticateAdmin for operations that require 2FA
 */
export const requireAdmin2FA: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const adminReq = req as AdminAuthRequest;

  if (!adminReq.user) {
    res.status(401).json({ error: { message: 'Admin authentication required' } });
    return;
  }

  // If user has 2FA enabled, verify it was completed during login
  if (adminReq.user.twoFactorEnabled && !adminReq.twoFactorVerified) {
    res.status(403).json({
      error: {
        message: '2FA verification required for this operation',
        code: 'ADMIN_2FA_REQUIRED'
      }
    });
    return;
  }

  next();
};

/**
 * Require super admin role for specific operations
 * Use after authenticateAdmin
 */
export const requireSuperAdminSession: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const adminReq = req as AdminAuthRequest;

  if (!adminReq.user) {
    res.status(401).json({ error: { message: 'Admin authentication required' } });
    return;
  }

  if (adminReq.user.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({ error: { message: 'Super Admin access required' } });
    return;
  }

  next();
};

export default {
  authenticateAdmin,
  requireAdmin2FA,
  requireSuperAdminSession
};
