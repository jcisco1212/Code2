import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin, requireSuperAdmin, optionalAuth } from '../middleware/auth';
import {
  BroadcastNotification,
  BroadcastType,
  BroadcastTarget,
  BroadcastPriority,
  BroadcastStatus,
  UserBroadcastStatus,
  BroadcastUserStatus,
  User
} from '../models';
import {
  createBroadcastNotification,
  sendBroadcastNotification,
  markBroadcastViewed,
  markBroadcastDismissed,
  acknowledgeBroadcast,
  getPendingBroadcasts
} from '../services/notificationService';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/v1/broadcasts
 * Get all broadcast notifications (admin)
 */
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, type, priority } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (priority) whereClause.priority = priority;

    const broadcasts = await BroadcastNotification.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'displayName', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      broadcasts: broadcasts.rows,
      pagination: {
        total: broadcasts.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(broadcasts.count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/broadcasts/pending
 * Get pending broadcasts for current user (popup display)
 */
router.get('/pending', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const broadcasts = await getPendingBroadcasts(userId, userRole);

    res.json({ broadcasts });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/broadcasts/active
 * Get currently active broadcasts (public, for showing to users)
 */
router.get('/active', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || 'user';

    const roleTargetMap: Record<string, BroadcastTarget[]> = {
      user: [BroadcastTarget.ALL, BroadcastTarget.USERS],
      creator: [BroadcastTarget.ALL, BroadcastTarget.CREATORS],
      agent: [BroadcastTarget.ALL, BroadcastTarget.AGENTS, BroadcastTarget.ENTERTAINMENT_PROFESSIONALS],
      admin: [BroadcastTarget.ALL, BroadcastTarget.ADMINS],
      super_admin: [BroadcastTarget.ALL, BroadcastTarget.SUPER_ADMINS, BroadcastTarget.ADMINS]
    };

    const applicableTargets = roleTargetMap[userRole] || [BroadcastTarget.ALL];

    // Get active broadcasts
    const broadcasts = await BroadcastNotification.findAll({
      where: {
        status: BroadcastStatus.ACTIVE,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ],
        targets: { [Op.overlap]: applicableTargets }
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: 10
    });

    // If user is logged in, filter out already viewed/dismissed
    if (userId) {
      const viewedIds = await UserBroadcastStatus.findAll({
        where: {
          userId,
          status: { [Op.in]: [BroadcastUserStatus.DISMISSED, BroadcastUserStatus.ACKNOWLEDGED] }
        },
        attributes: ['broadcastId']
      }).then(statuses => statuses.map(s => s.broadcastId));

      const filteredBroadcasts = broadcasts.filter(b => !viewedIds.includes(b.id));
      return res.json({ broadcasts: filteredBroadcasts });
    }

    res.json({ broadcasts });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/broadcasts/:id
 * Get a specific broadcast
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const broadcast = await BroadcastNotification.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'displayName', 'avatarUrl']
      }]
    });

    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    // Mark as viewed for this user
    await markBroadcastViewed(id, req.user!.id);

    res.json({ broadcast });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/broadcasts
 * Create a new broadcast notification (admin/super admin)
 */
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      type,
      title,
      message,
      targets,
      priority,
      showPopup,
      sendPush,
      sendEmail,
      sendSms,
      actionUrl,
      actionText,
      imageUrl,
      dismissible,
      requireAcknowledge,
      surveyData,
      scheduledAt,
      expiresAt,
      data
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ error: 'Type, title, and message are required' });
    }

    // Validate type
    if (!Object.values(BroadcastType).includes(type)) {
      return res.status(400).json({ error: 'Invalid broadcast type' });
    }

    // Validate targets
    if (targets) {
      for (const target of targets) {
        if (!Object.values(BroadcastTarget).includes(target)) {
          return res.status(400).json({ error: `Invalid target: ${target}` });
        }
      }
    }

    const broadcast = await createBroadcastNotification(type, title, message, {
      targets: targets || [BroadcastTarget.ALL],
      priority: priority || BroadcastPriority.NORMAL,
      showPopup,
      sendPush,
      sendEmail,
      sendSms,
      actionUrl,
      actionText,
      imageUrl,
      dismissible,
      requireAcknowledge,
      surveyData,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user!.id,
      data
    });

    res.status(201).json({ broadcast });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/broadcasts/:id
 * Update a broadcast (only drafts and scheduled)
 */
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const broadcast = await BroadcastNotification.findByPk(id);
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    // Can only update draft or scheduled broadcasts
    if (broadcast.status !== BroadcastStatus.DRAFT && broadcast.status !== BroadcastStatus.SCHEDULED) {
      return res.status(400).json({ error: 'Can only update draft or scheduled broadcasts' });
    }

    await broadcast.update(updates);

    res.json({ broadcast });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/broadcasts/:id/send
 * Send a scheduled or draft broadcast immediately
 */
router.post('/:id/send', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const broadcast = await BroadcastNotification.findByPk(id);
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    if (broadcast.status === BroadcastStatus.ACTIVE) {
      return res.status(400).json({ error: 'Broadcast is already active' });
    }

    if (broadcast.status === BroadcastStatus.CANCELLED || broadcast.status === BroadcastStatus.EXPIRED) {
      return res.status(400).json({ error: 'Cannot send cancelled or expired broadcast' });
    }

    const result = await sendBroadcastNotification(broadcast);

    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/broadcasts/:id/view
 * Mark broadcast as viewed by current user
 */
router.put('/:id/view', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await markBroadcastViewed(id, req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/broadcasts/:id/dismiss
 * Dismiss a broadcast
 */
router.put('/:id/dismiss', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await markBroadcastDismissed(id, req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/broadcasts/:id/acknowledge
 * Acknowledge a broadcast (with optional survey response)
 */
router.put('/:id/acknowledge', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { surveyResponse } = req.body;

    await acknowledgeBroadcast(id, req.user!.id, surveyResponse);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/broadcasts/:id/cancel
 * Cancel a broadcast
 */
router.post('/:id/cancel', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const broadcast = await BroadcastNotification.findByPk(id);
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    await broadcast.update({ status: BroadcastStatus.CANCELLED });

    res.json({ success: true, broadcast });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/broadcasts/:id
 * Delete a broadcast (super admin only, only draft broadcasts)
 */
router.delete('/:id', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const broadcast = await BroadcastNotification.findByPk(id);
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    if (broadcast.status !== BroadcastStatus.DRAFT) {
      return res.status(400).json({ error: 'Can only delete draft broadcasts' });
    }

    await broadcast.destroy();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/broadcasts/:id/stats
 * Get broadcast statistics
 */
router.get('/:id/stats', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const broadcast = await BroadcastNotification.findByPk(id);
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    // Get detailed stats
    const statusCounts = await UserBroadcastStatus.findAll({
      where: { broadcastId: id },
      attributes: [
        'status',
        [UserBroadcastStatus.sequelize!.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    res.json({
      totalSent: broadcast.totalSent,
      totalViewed: broadcast.totalViewed,
      totalDismissed: broadcast.totalDismissed,
      totalAcknowledged: broadcast.totalAcknowledged,
      statusBreakdown: statusCounts.map((item: any) => ({
        status: item.status,
        count: parseInt(item.dataValues.count)
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/broadcasts/types
 * Get available broadcast types and targets
 */
router.get('/config/options', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      types: Object.values(BroadcastType),
      targets: Object.values(BroadcastTarget),
      priorities: Object.values(BroadcastPriority),
      statuses: Object.values(BroadcastStatus)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
