import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Authenticate JWT token
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is disabled' });
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    const user = await User.findByPk(decoded.userId);

    if (user && user.isActive) {
      req.user = user;
      req.userId = user.id;
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Check if user has required role
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Check if email is verified
export const requireVerifiedEmail = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({ error: 'Email verification required' });
    return;
  }

  next();
};

// Check if user is an agent
export const requireAgent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== UserRole.AGENT) {
    res.status(403).json({ error: 'Agent access required' });
    return;
  }

  next();
};

// Check if user is admin or moderator
export const requireModeratorOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

// Check if 2FA is complete (if enabled)
export const require2FA = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // This would check a session/token flag indicating 2FA completion
  // For now, we'll pass through since 2FA verification happens at login
  next();
};

export default {
  authenticate,
  optionalAuth,
  requireRole,
  requireVerifiedEmail,
  requireAgent,
  requireModeratorOrAdmin,
  require2FA
};
