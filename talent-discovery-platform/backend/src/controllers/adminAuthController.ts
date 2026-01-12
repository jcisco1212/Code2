import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Op } from 'sequelize';
import { User, UserRole } from '../models';
import { AuthRequest, JWTPayload } from '../middleware/auth';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../middleware/errorHandler';
import { redis } from '../config/redis';
import { logger, logAudit } from '../utils/logger';

// Admin-specific JWT configuration (separate from regular user auth)
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'default-admin-secret';
const ADMIN_JWT_REFRESH_SECRET = process.env.ADMIN_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'default-admin-refresh-secret';
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '1h'; // Shorter expiry for admin tokens
const ADMIN_JWT_REFRESH_EXPIRES_IN = process.env.ADMIN_JWT_REFRESH_EXPIRES_IN || '7d';

// Admin JWT payload includes additional context
export interface AdminJWTPayload extends JWTPayload {
  isAdminSession: boolean;
  twoFactorVerified?: boolean;
}

// Generate admin-specific tokens
const generateAdminTokens = (user: User, twoFactorVerified: boolean = false) => {
  const payload: AdminJWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    isAdminSession: true,
    twoFactorVerified
  };

  const accessToken = jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: ADMIN_JWT_EXPIRES_IN } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, ADMIN_JWT_REFRESH_SECRET, { expiresIn: ADMIN_JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

// Admin login - separate authentication flow
export const adminLogin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier.toLowerCase() },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      // Log failed attempt
      logger.warn('Admin login failed - user not found', { identifier });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is an admin or super admin
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      logger.warn('Admin login failed - insufficient privileges', { identifier, role: user.role });
      throw new ForbiddenError('Admin access required');
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn('Admin login failed - account disabled', { identifier });
      throw new UnauthorizedError('Account is disabled');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn('Admin login failed - invalid password', { identifier });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Check if 2FA is enabled - if so, require verification before issuing tokens
    if (user.twoFactorEnabled) {
      // Store a temporary session token for 2FA verification
      const tempToken = jwt.sign(
        { userId: user.id, purpose: 'admin-2fa' },
        ADMIN_JWT_SECRET,
        { expiresIn: '5m' } // 5 minute window to complete 2FA
      );

      // Store in Redis that this user is pending 2FA
      await redis.setex(`admin-2fa-pending:${user.id}`, 300, 'pending');

      logAudit('ADMIN_LOGIN_2FA_REQUIRED', user.id, { identifier });

      res.json({
        requires2FA: true,
        tempToken,
        message: 'Please enter your 2FA code to complete admin login'
      });
      return;
    }

    // No 2FA required - generate tokens directly
    const tokens = generateAdminTokens(user, false);

    // Store admin refresh token in Redis with admin prefix
    await redis.setex(`admin-refresh:${user.id}`, 7 * 24 * 60 * 60, tokens.refreshToken);

    logAudit('ADMIN_LOGIN', user.id, { identifier, has2FA: false });

    res.json({
      message: 'Admin login successful',
      user: user.toAuthJSON(),
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

// Admin 2FA verification
export const adminVerify2FA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tempToken, token } = req.body;

    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, ADMIN_JWT_SECRET);
    } catch {
      throw new UnauthorizedError('2FA session expired. Please login again.');
    }

    if (decoded.purpose !== 'admin-2fa') {
      throw new BadRequestError('Invalid 2FA session');
    }

    // Check Redis for pending 2FA
    const pending = await redis.get(`admin-2fa-pending:${decoded.userId}`);
    if (!pending) {
      throw new UnauthorizedError('2FA session expired. Please login again.');
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestError('Invalid request');
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      logger.warn('Admin 2FA verification failed', { userId: user.id });
      throw new UnauthorizedError('Invalid 2FA code');
    }

    // Clear pending 2FA flag
    await redis.del(`admin-2fa-pending:${user.id}`);

    // Generate full admin tokens with 2FA verified flag
    const tokens = generateAdminTokens(user, true);

    // Store admin refresh token
    await redis.setex(`admin-refresh:${user.id}`, 7 * 24 * 60 * 60, tokens.refreshToken);

    logAudit('ADMIN_LOGIN_2FA_VERIFIED', user.id, {});

    res.json({
      message: 'Admin login successful',
      user: user.toAuthJSON(),
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

// Admin refresh token
export const adminRefreshToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    // Verify admin refresh token
    const decoded = jwt.verify(token, ADMIN_JWT_REFRESH_SECRET) as AdminJWTPayload;

    if (!decoded.isAdminSession) {
      throw new UnauthorizedError('Invalid admin session');
    }

    // Check if token is stored in Redis
    const storedToken = await redis.get(`admin-refresh:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Get user and verify still admin
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid user');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      // User is no longer an admin - invalidate session
      await redis.del(`admin-refresh:${decoded.userId}`);
      throw new ForbiddenError('Admin access revoked');
    }

    // Generate new tokens
    const tokens = generateAdminTokens(user, decoded.twoFactorVerified);

    // Update refresh token in Redis
    await redis.setex(`admin-refresh:${user.id}`, 7 * 24 * 60 * 60, tokens.refreshToken);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

// Admin logout
export const adminLogout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.userId) {
      // Clear admin refresh token
      await redis.del(`admin-refresh:${req.userId}`);
      // Clear any pending 2FA
      await redis.del(`admin-2fa-pending:${req.userId}`);
      logAudit('ADMIN_LOGOUT', req.userId, {});
    }

    res.json({ message: 'Admin logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Get current admin session info
export const getAdminSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    res.json({
      user: user.toAuthJSON(),
      session: {
        isAdminSession: true,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Setup 2FA for admin account
export const adminSetup2FA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    if (user.twoFactorEnabled) {
      throw new BadRequestError('2FA is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Get-Noticed Admin (${user.email})`,
      length: 20
    });

    // Store secret temporarily (will be confirmed after verification)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan the QR code with your authenticator app, then confirm with a code'
    });
  } catch (error) {
    next(error);
  }
};

// Confirm 2FA setup for admin
export const adminConfirm2FA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { token } = req.body;

    if (!user.twoFactorSecret) {
      throw new BadRequestError('2FA setup not initiated');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestError('2FA is already enabled');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      throw new BadRequestError('Invalid verification code');
    }

    user.twoFactorEnabled = true;
    await user.save();

    logAudit('ADMIN_2FA_ENABLED', user.id, {});

    res.json({ message: '2FA enabled successfully for admin account' });
  } catch (error) {
    next(error);
  }
};

// Disable 2FA for admin (requires password and current 2FA code)
export const adminDisable2FA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { password, token } = req.body;

    if (!user.twoFactorEnabled) {
      throw new BadRequestError('2FA is not enabled');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid password');
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      throw new UnauthorizedError('Invalid 2FA code');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    logAudit('ADMIN_2FA_DISABLED', user.id, {});

    res.json({ message: '2FA disabled for admin account' });
  } catch (error) {
    next(error);
  }
};

export default {
  adminLogin,
  adminVerify2FA,
  adminRefreshToken,
  adminLogout,
  getAdminSession,
  adminSetup2FA,
  adminConfirm2FA,
  adminDisable2FA
};
