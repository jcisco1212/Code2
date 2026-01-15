import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import Announcement from '../models/Announcement';

const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const adminRoles = ['admin', 'super_admin', 'moderator'];
  if (!req.user?.role || !adminRoles.includes(req.user.role)) {
    res.status(403).json({ error: { message: 'Admin access required' } });
    return;
  }
  next();
};

// Get active announcements (public)
router.get(
  '/active',
  optionalAuth as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const userRole = req.user?.role || 'user';

      const where: any = {
        isActive: true,
        [Op.or]: [
          { startsAt: null },
          { startsAt: { [Op.lte]: now } }
        ],
        [Op.and]: [
          {
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: now } }
            ]
          }
        ]
      };

      // Filter by target based on user role
      if (userRole === 'creator') {
        where.target = { [Op.in]: ['all', 'creators'] };
      } else if (userRole === 'agent') {
        where.target = { [Op.in]: ['all', 'agents'] };
      } else if (userRole === 'admin') {
        where.target = { [Op.in]: ['all', 'admins'] };
      } else {
        where.target = 'all';
      }

      const announcements = await Announcement.findAll({
        where,
        order: [['isPinned', 'DESC'], ['createdAt', 'DESC']]
      });

      res.json({ announcements });
    } catch (error) {
      next(error);
    }
  }
);

// Get all announcements (admin only)
router.get(
  '/',
  authenticate as RequestHandler,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const announcements = await Announcement.findAll({
        order: [['createdAt', 'DESC']]
      });

      res.json({ announcements });
    } catch (error) {
      next(error);
    }
  }
);

// Create announcement (admin only)
router.post(
  '/',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    body('title').notEmpty().isLength({ max: 255 }),
    body('content').notEmpty().isLength({ max: 10000 }),
    body('type').optional().isIn(['info', 'warning', 'success', 'error']),
    body('target').optional().isIn(['all', 'creators', 'agents', 'admins']),
    body('isPinned').optional().isBoolean(),
    body('startsAt').optional().isISO8601(),
    body('expiresAt').optional().isISO8601()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, content, type = 'info', target = 'all', isPinned = false, startsAt, expiresAt } = req.body;

      const announcement = await Announcement.create({
        title,
        content,
        type,
        target,
        isPinned,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.userId!
      });

      res.status(201).json({ announcement });
    } catch (error) {
      next(error);
    }
  }
);

// Update announcement (admin only)
router.put(
  '/:id',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    param('id').isUUID(),
    body('title').optional().isLength({ max: 255 }),
    body('content').optional().isLength({ max: 10000 }),
    body('type').optional().isIn(['info', 'warning', 'success', 'error']),
    body('target').optional().isIn(['all', 'creators', 'agents', 'admins']),
    body('isActive').optional().isBoolean(),
    body('isPinned').optional().isBoolean(),
    body('startsAt').optional().isISO8601(),
    body('expiresAt').optional().isISO8601()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const announcement = await Announcement.findByPk(req.params.id);

      if (!announcement) {
        throw new NotFoundError('Announcement not found');
      }

      const { title, content, type, target, isActive, isPinned, startsAt, expiresAt } = req.body;

      await announcement.update({
        ...(title && { title }),
        ...(content && { content }),
        ...(type && { type }),
        ...(target && { target }),
        ...(isActive !== undefined && { isActive }),
        ...(isPinned !== undefined && { isPinned }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
      });

      res.json({ announcement });
    } catch (error) {
      next(error);
    }
  }
);

// Delete announcement (admin only)
router.delete(
  '/:id',
  authenticate as RequestHandler,
  isAdmin,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const announcement = await Announcement.findByPk(req.params.id);

      if (!announcement) {
        throw new NotFoundError('Announcement not found');
      }

      await announcement.destroy();

      res.json({ message: 'Announcement deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
