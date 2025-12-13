import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User, UserRole } from '../models';
import { AuthRequest, JWTPayload } from '../middleware/auth';
import { BadRequestError, UnauthorizedError, ConflictError } from '../middleware/errorHandler';
import { redis } from '../config/redis';
import { sendEmail } from '../services/emailService';
import { logger, logAudit } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Generate tokens
const generateTokens = (user: User) => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

  return { accessToken, refreshToken };
};

// Register new user
export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, username, password, firstName, lastName, role } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user - combine firstName and lastName into displayName
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : username;

    const user = await User.create({
      email,
      username,
      passwordHash: password, // Will be hashed by beforeCreate hook
      displayName,
      role: role || UserRole.USER,
      emailVerificationToken
    });

    // Send verification email (don't await to not block response)
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3001'}/verify-email?token=${emailVerificationToken}`;
    sendEmail({
      to: email,
      subject: 'Verify your TalentVault account',
      template: 'email-verification',
      data: {
        name: displayName,
        verificationUrl
      }
    }).catch(err => logger.error('Failed to send verification email', { error: err.message }));

    logAudit('USER_REGISTERED', user.id, { email, username });

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: user.toAuthJSON()
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // DEBUG: Log user isActive value
    console.log('DEBUG LOGIN - user.isActive:', user.isActive, 'type:', typeof user.isActive);
    console.log('DEBUG LOGIN - user data:', JSON.stringify(user.toJSON(), null, 2));

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      res.json({
        requires2FA: true,
        userId: user.id,
        message: 'Please enter your 2FA code'
      });
      return;
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Store refresh token in Redis
    await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);

    logAudit('USER_LOGIN', user.id, { email });

    res.json({
      message: 'Login successful',
      user: user.toAuthJSON(),
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

// Verify 2FA
export const verify2FA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, token } = req.body;

    const user = await User.findByPk(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestError('Invalid request');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      throw new UnauthorizedError('Invalid 2FA code');
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Store refresh token
    await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);

    logAudit('USER_2FA_VERIFIED', user.id, {});

    res.json({
      message: 'Login successful',
      user: user.toAuthJSON(),
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;

    // Check if token is stored in Redis
    const storedToken = await redis.get(`refresh:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Get user
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid user');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token in Redis
    await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.userId) {
      await redis.del(`refresh:${req.userId}`);
      logAudit('USER_LOGOUT', req.userId, {});
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      where: {
        emailVerificationToken: token as string
      }
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    logAudit('EMAIL_VERIFIED', user.id, {});

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: 'If an account exists, a password reset email has been sent' });
      return;
    }

    // Generate reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send email
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3001'}/reset-password?token=${passwordResetToken}`;
    sendEmail({
      to: user.email,
      subject: 'Reset your TalentVault password',
      template: 'password-reset',
      data: {
        name: user.displayName || user.username,
        resetUrl
      }
    }).catch(err => logger.error('Failed to send reset email', { error: err.message }));

    logAudit('PASSWORD_RESET_REQUESTED', user.id, {});

    res.json({ message: 'If an account exists, a password reset email has been sent' });
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      where: {
        passwordResetToken: token
      }
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new BadRequestError('Reset token has expired');
    }

    user.passwordHash = password; // Will be hashed by beforeUpdate hook
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    // Invalidate refresh tokens
    await redis.del(`refresh:${user.id}`);

    logAudit('PASSWORD_RESET_COMPLETED', user.id, {});

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// Enable 2FA - Generate secret
export const enable2FA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    if (user.twoFactorEnabled) {
      throw new BadRequestError('2FA is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `TalentVault (${user.email})`,
      length: 20
    });

    // Store secret temporarily
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    next(error);
  }
};

// Confirm 2FA
export const confirm2FA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { token } = req.body;

    if (!user.twoFactorSecret) {
      throw new BadRequestError('2FA setup not initiated');
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

    logAudit('2FA_ENABLED', user.id, {});

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    next(error);
  }
};

// Disable 2FA
export const disable2FA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    logAudit('2FA_DISABLED', user.id, {});

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    user.passwordHash = newPassword; // Will be hashed by beforeUpdate hook
    await user.save();

    // Invalidate refresh tokens
    await redis.del(`refresh:${user.id}`);

    logAudit('PASSWORD_CHANGED', user.id, {});

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ user: req.user!.toAuthJSON() });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    if (user.emailVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Generate new token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    await user.save();

    // Send email
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3001'}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your TalentVault account',
      template: 'email-verification',
      data: {
        name: user.displayName || user.username,
        verificationUrl
      }
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  verify2FA,
  refreshToken,
  logout,
  resendVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
  enable2FA,
  confirm2FA,
  disable2FA,
  changePassword,
  getCurrentUser
};
