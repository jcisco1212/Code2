import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { AdminNotificationSettings, User, UserRole } from '../models';
import { sendVerificationCode, verifyPhoneNumber } from '../services/smsService';
import { logger } from '../utils/logger';
import { redis } from '../config/redis';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/v1/admin/notification-settings
 * Get current admin's notification settings
 */
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    let settings = await AdminNotificationSettings.findOne({
      where: { userId }
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await AdminNotificationSettings.create({
        userId
      });
    }

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/notification-settings
 * Update current admin's notification settings
 */
router.put('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      industryPopupEnabled,
      industryPushEnabled,
      industrySmsEnabled,
      industryEmailEnabled,
      agentSignupNotify,
      agentVerifiedNotify,
      promoterSignupNotify,
      managerSignupNotify,
      castingDirectorSignupNotify,
      producerSignupNotify,
      industryContactNotify,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      quietHoursTimezone,
      digestEnabled,
      digestFrequency
    } = req.body;

    let settings = await AdminNotificationSettings.findOne({
      where: { userId }
    });

    if (!settings) {
      settings = await AdminNotificationSettings.create({ userId });
    }

    // Build update object with only provided fields
    const updates: Partial<AdminNotificationSettings> = {};
    if (industryPopupEnabled !== undefined) updates.industryPopupEnabled = industryPopupEnabled;
    if (industryPushEnabled !== undefined) updates.industryPushEnabled = industryPushEnabled;
    if (industrySmsEnabled !== undefined) updates.industrySmsEnabled = industrySmsEnabled;
    if (industryEmailEnabled !== undefined) updates.industryEmailEnabled = industryEmailEnabled;
    if (agentSignupNotify !== undefined) updates.agentSignupNotify = agentSignupNotify;
    if (agentVerifiedNotify !== undefined) updates.agentVerifiedNotify = agentVerifiedNotify;
    if (promoterSignupNotify !== undefined) updates.promoterSignupNotify = promoterSignupNotify;
    if (managerSignupNotify !== undefined) updates.managerSignupNotify = managerSignupNotify;
    if (castingDirectorSignupNotify !== undefined) updates.castingDirectorSignupNotify = castingDirectorSignupNotify;
    if (producerSignupNotify !== undefined) updates.producerSignupNotify = producerSignupNotify;
    if (industryContactNotify !== undefined) updates.industryContactNotify = industryContactNotify;
    if (quietHoursEnabled !== undefined) updates.quietHoursEnabled = quietHoursEnabled;
    if (quietHoursStart !== undefined) updates.quietHoursStart = quietHoursStart;
    if (quietHoursEnd !== undefined) updates.quietHoursEnd = quietHoursEnd;
    if (quietHoursTimezone !== undefined) updates.quietHoursTimezone = quietHoursTimezone;
    if (digestEnabled !== undefined) updates.digestEnabled = digestEnabled;
    if (digestFrequency !== undefined) updates.digestFrequency = digestFrequency;

    await settings.update(updates);

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/notification-settings/phone/request-verification
 * Request phone verification code
 */
router.post('/phone/request-verification', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Verify phone number format
    const verification = await verifyPhoneNumber(phoneNumber);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error || 'Invalid phone number' });
    }

    const formattedNumber = verification.formattedNumber || phoneNumber;

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in Redis with 10 minute expiry
    const cacheKey = `phone-verification:${req.user!.id}`;
    await redis.set(cacheKey, JSON.stringify({
      code,
      phoneNumber: formattedNumber,
      attempts: 0
    }), 'EX', 600);

    // Send verification code
    const result = await sendVerificationCode(formattedNumber, code);

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send verification code' });
    }

    res.json({
      success: true,
      message: 'Verification code sent',
      formattedNumber
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/notification-settings/phone/verify
 * Verify phone number with code
 */
router.post('/phone/verify', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const cacheKey = `phone-verification:${req.user!.id}`;
    const cached = await redis.get(cacheKey);

    if (!cached) {
      return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
    }

    const data = JSON.parse(cached);

    // Check max attempts
    if (data.attempts >= 3) {
      await redis.del(cacheKey);
      return res.status(400).json({ error: 'Too many attempts. Please request a new code.' });
    }

    // Verify code
    if (data.code !== code) {
      data.attempts++;
      await redis.set(cacheKey, JSON.stringify(data), 'EX', 600);
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Update settings with verified phone number
    let settings = await AdminNotificationSettings.findOne({
      where: { userId: req.user!.id }
    });

    if (!settings) {
      settings = await AdminNotificationSettings.create({ userId: req.user!.id });
    }

    await settings.update({
      smsPhoneNumber: data.phoneNumber,
      smsVerified: true
    });

    // Clear verification cache
    await redis.del(cacheKey);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      phoneNumber: data.phoneNumber
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/admin/notification-settings/phone
 * Remove verified phone number
 */
router.delete('/phone', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await AdminNotificationSettings.findOne({
      where: { userId: req.user!.id }
    });

    if (settings) {
      await settings.update({
        smsPhoneNumber: null,
        smsVerified: false,
        industrySmsEnabled: false
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ===== Super Admin Routes =====

/**
 * GET /api/v1/admin/notification-settings/all
 * Get all admin notification settings (super admin only)
 */
router.get('/all', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const admins = await User.findAndCountAll({
      where: {
        role: { [Op.in]: ['admin', 'super_admin'] },
        isActive: true
      },
      include: [{
        model: AdminNotificationSettings,
        as: 'adminNotificationSettings',
        required: false
      }],
      attributes: ['id', 'username', 'displayName', 'email', 'role', 'avatarUrl'],
      order: [['role', 'DESC'], ['username', 'ASC']],
      limit: Number(limit),
      offset
    });

    res.json({
      admins: admins.rows,
      pagination: {
        total: admins.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(admins.count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/notification-settings/:adminId
 * Update another admin's notification settings (super admin only)
 */
router.put('/:adminId', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const updates = req.body;

    // Verify the target user is an admin
    const targetUser = await User.findByPk(adminId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role !== UserRole.ADMIN && targetUser.role !== UserRole.SUPER_ADMIN) {
      return res.status(400).json({ error: 'Target user is not an admin' });
    }

    let settings = await AdminNotificationSettings.findOne({
      where: { userId: adminId }
    });

    if (!settings) {
      settings = await AdminNotificationSettings.create({ userId: adminId });
    }

    // Remove sensitive fields that shouldn't be set by super admin
    delete updates.smsPhoneNumber;
    delete updates.smsVerified;

    await settings.update(updates);

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/notification-settings/bulk-update
 * Bulk update notification settings for multiple admins (super admin only)
 */
router.post('/bulk-update', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminIds, updates } = req.body;

    if (!adminIds || !Array.isArray(adminIds) || adminIds.length === 0) {
      return res.status(400).json({ error: 'Admin IDs are required' });
    }

    // Remove sensitive fields
    delete updates.smsPhoneNumber;
    delete updates.smsVerified;

    // Update all matching settings
    const [updatedCount] = await AdminNotificationSettings.update(updates, {
      where: {
        userId: { [Op.in]: adminIds }
      }
    });

    // Create settings for admins that don't have them
    const existingSettings = await AdminNotificationSettings.findAll({
      where: { userId: { [Op.in]: adminIds } },
      attributes: ['userId']
    });

    const existingUserIds = existingSettings.map(s => s.userId);
    const newUserIds = adminIds.filter((id: string) => !existingUserIds.includes(id));

    if (newUserIds.length > 0) {
      await AdminNotificationSettings.bulkCreate(
        newUserIds.map((userId: string) => ({
          userId,
          ...updates
        }))
      );
    }

    res.json({
      success: true,
      updated: updatedCount,
      created: newUserIds.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/notification-settings/reset/:adminId
 * Reset an admin's notification settings to defaults (super admin only)
 */
router.post('/reset/:adminId', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;

    const settings = await AdminNotificationSettings.findOne({
      where: { userId: adminId }
    });

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    // Reset to defaults (keeping phone number)
    await settings.update({
      industryPopupEnabled: true,
      industryPushEnabled: true,
      industrySmsEnabled: false,
      industryEmailEnabled: true,
      agentSignupNotify: true,
      agentVerifiedNotify: true,
      promoterSignupNotify: true,
      managerSignupNotify: true,
      castingDirectorSignupNotify: true,
      producerSignupNotify: true,
      industryContactNotify: true,
      quietHoursEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      quietHoursTimezone: null,
      digestEnabled: false,
      digestFrequency: null
    });

    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
});

export default router;
