import { Router } from 'express';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { Notification } from '../models';
import { NotFoundError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

const router = Router();

// Get user's notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    const unreadCount = await Notification.count({
      where: { userId: req.userId, isRead: false }
    });

    res.json({
      notifications: rows,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put(
  '/:id/read',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid notification ID required')]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: { id, userId: req.userId }
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      await notification.update({ isRead: true, readAt: new Date() });

      res.json({ notification });
    } catch (error) {
      next(error);
    }
  }
);

// Mark all as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.userId, isRead: false } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid notification ID required')]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const deleted = await Notification.destroy({
        where: { id, userId: req.userId }
      });

      if (!deleted) {
        throw new NotFoundError('Notification not found');
      }

      res.json({ message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// Get unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await Notification.count({
      where: { userId: req.userId, isRead: false }
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

export default router;
