import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import {
  IndustryNotification,
  IndustryEventType,
  AdminIndustryNotificationStatus,
  AdminNotificationStatus,
  User
} from '../models';
import { getPendingIndustryNotifications, createIndustryNotification } from '../services/notificationService';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/v1/industry-notifications
 * Get industry notifications for admin
 */
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, eventType } = req.query;
    const userId = req.user!.id;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (eventType) {
      whereClause.eventType = eventType;
    }

    const notifications = await IndustryNotification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'industryUser',
          attributes: ['id', 'username', 'displayName', 'avatarUrl', 'role', 'agentCompanyName', 'agentType']
        },
        {
          model: AdminIndustryNotificationStatus,
          as: 'adminStatuses',
          where: { adminId: userId },
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    // Filter by status if provided
    let filteredNotifications = notifications.rows;
    if (status) {
      filteredNotifications = notifications.rows.filter(notification => {
        const adminStatus = (notification as any).adminStatuses?.[0];
        if (status === 'pending') {
          return !adminStatus || adminStatus.status === AdminNotificationStatus.PENDING;
        }
        return adminStatus?.status === status;
      });
    }

    res.json({
      notifications: filteredNotifications,
      pagination: {
        total: notifications.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(notifications.count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/industry-notifications/pending
 * Get pending industry notifications for popup display
 */
router.get('/pending', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;
    const notifications = await getPendingIndustryNotifications(adminId);

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/industry-notifications/unread-count
 * Get count of unread industry notifications
 */
router.get('/unread-count', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;

    const viewedIds = await AdminIndustryNotificationStatus.findAll({
      where: {
        adminId,
        status: { [Op.in]: [AdminNotificationStatus.VIEWED, AdminNotificationStatus.DISMISSED] }
      },
      attributes: ['industryNotificationId']
    }).then(statuses => statuses.map(s => s.industryNotificationId));

    const unreadCount = await IndustryNotification.count({
      where: {
        id: { [Op.notIn]: viewedIds }
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/industry-notifications/:id
 * Get a specific industry notification
 */
router.get('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await IndustryNotification.findByPk(id, {
      include: [
        {
          model: User,
          as: 'industryUser',
          attributes: ['id', 'username', 'displayName', 'avatarUrl', 'role', 'agentCompanyName', 'agentType', 'email', 'agentLinkedIn']
        }
      ]
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Mark as viewed
    await AdminIndustryNotificationStatus.upsert({
      adminId: userId,
      industryNotificationId: id,
      status: AdminNotificationStatus.VIEWED,
      viewedAt: new Date()
    });

    res.json({ notification });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/industry-notifications/:id/view
 * Mark an industry notification as viewed
 */
router.put('/:id/view', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await AdminIndustryNotificationStatus.upsert({
      adminId,
      industryNotificationId: id,
      status: AdminNotificationStatus.VIEWED,
      viewedAt: new Date(),
      popupShown: true,
      popupShownAt: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/industry-notifications/:id/dismiss
 * Dismiss an industry notification
 */
router.put('/:id/dismiss', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await AdminIndustryNotificationStatus.upsert({
      adminId,
      industryNotificationId: id,
      status: AdminNotificationStatus.DISMISSED,
      dismissedAt: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/industry-notifications/dismiss-all
 * Dismiss all pending industry notifications
 */
router.put('/dismiss-all', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;

    // Get all notification IDs
    const allNotifications = await IndustryNotification.findAll({
      attributes: ['id']
    });

    // Create or update status for all
    const statusRecords = allNotifications.map(n => ({
      adminId,
      industryNotificationId: n.id,
      status: AdminNotificationStatus.DISMISSED,
      dismissedAt: new Date()
    }));

    await AdminIndustryNotificationStatus.bulkCreate(statusRecords, {
      updateOnDuplicate: ['status', 'dismissedAt', 'updatedAt']
    });

    res.json({ success: true, dismissedCount: statusRecords.length });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/industry-notifications/test
 * Create a test industry notification (super admin only, for testing)
 */
router.post('/test', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventType, title, message, data } = req.body;

    if (!eventType || !Object.values(IndustryEventType).includes(eventType)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const notification = await createIndustryNotification(
      eventType,
      req.user!.id,
      title || `Test ${eventType} notification`,
      message || `This is a test notification for ${eventType}`,
      data || { name: 'Test User', company: 'Test Company' }
    );

    res.json({ notification });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/industry-notifications/stats
 * Get industry notification statistics (super admin only)
 */
router.get('/stats/overview', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    // Count by event type
    const byEventType = await IndustryNotification.findAll({
      where: whereClause,
      attributes: [
        'eventType',
        [IndustryNotification.sequelize!.fn('COUNT', '*'), 'count']
      ],
      group: ['eventType']
    });

    // Total counts
    const totalCount = await IndustryNotification.count({ where: whereClause });

    // Today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await IndustryNotification.count({
      where: {
        ...whereClause,
        createdAt: { [Op.gte]: today }
      }
    });

    res.json({
      total: totalCount,
      today: todayCount,
      byEventType: byEventType.map((item: any) => ({
        eventType: item.eventType,
        count: parseInt(item.dataValues.count)
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
