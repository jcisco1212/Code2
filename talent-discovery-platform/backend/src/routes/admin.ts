import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, requireRole, requireModeratorOrAdmin, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { User, UserRole, Video, VideoStatus, Comment, CommentStatus, Report, ReportStatus, Category } from '../models';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { Op, fn, col } from 'sequelize';
import { cacheDelete } from '../config/redis';
import { logAudit } from '../utils/logger';

const router = Router();

// === User Management ===

// Get all users
router.get(
  '/users',
  authenticate,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 50, role, status, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (role) where.role = role;
      if (status === 'active') where.isActive = true;
      else if (status === 'inactive') where.isActive = false;
      if (search) {
        where[Op.or] = [
          { email: { [Op.iLike]: `%${search}%` } },
          { username: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['passwordHash', 'twoFactorSecret'] },
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        users: rows,
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
  }
);

// Update user active status
router.put(
  '/users/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN),
  validate([
    param('id').isUUID().withMessage('Valid user ID required'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive, reason } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.update({ isActive });

      logAudit('USER_STATUS_CHANGED', req.userId!, {
        targetUserId: id,
        isActive,
        reason
      });

      res.json({ user: user.toPublicJSON() });
    } catch (error) {
      next(error);
    }
  }
);

// Update user role
router.put(
  '/users/:id/role',
  authenticate,
  requireRole(UserRole.ADMIN),
  validate([
    param('id').isUUID().withMessage('Valid user ID required'),
    body('role').isIn(Object.values(UserRole)).withMessage('Invalid role')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.update({ role });

      logAudit('USER_ROLE_CHANGED', req.userId!, {
        targetUserId: id,
        newRole: role
      });

      res.json({ user: user.toPublicJSON() });
    } catch (error) {
      next(error);
    }
  }
);

// Verify agent
router.post(
  '/users/:id/verify-agent',
  authenticate,
  requireRole(UserRole.ADMIN),
  validate([
    param('id').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.role !== UserRole.AGENT) {
        res.status(400).json({ error: 'User is not an agent' });
        return;
      }

      await user.update({ isVerified: true });

      logAudit('AGENT_VERIFIED', req.userId!, { agentId: id });

      res.json({ message: 'Agent verified', user: user.toPublicJSON() });
    } catch (error) {
      next(error);
    }
  }
);

// === Video Management ===

// Get all videos (including pending)
router.get(
  '/videos',
  authenticate,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 50, status, moderationStatus } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;
      if (moderationStatus) where.moderationStatus = moderationStatus;

      const { count, rows } = await Video.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        videos: rows,
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
  }
);

// Moderate video
router.put(
  '/videos/:id/moderate',
  authenticate,
  requireModeratorOrAdmin,
  validate([
    param('id').isUUID().withMessage('Valid video ID required'),
    body('action').isIn(['approve', 'reject', 'remove', 'age-restrict']).withMessage('Invalid action'),
    body('reason').optional().trim().isLength({ max: 1000 }).withMessage('Reason max 1000 chars')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      const video = await Video.findByPk(id);
      if (!video) {
        throw new NotFoundError('Video not found');
      }

      const updates: any = { moderationNotes: reason };

      switch (action) {
        case 'approve':
          updates.moderationStatus = 'approved';
          break;
        case 'reject':
          updates.moderationStatus = 'rejected';
          updates.status = VideoStatus.REMOVED;
          break;
        case 'remove':
          updates.status = VideoStatus.REMOVED;
          updates.moderationStatus = 'removed';
          break;
        case 'age-restrict':
          updates.ageRestricted = true;
          updates.moderationStatus = 'approved';
          break;
      }

      await video.update(updates);

      logAudit('VIDEO_MODERATED', req.userId!, {
        videoId: id,
        action,
        reason
      });

      res.json({ video });
    } catch (error) {
      next(error);
    }
  }
);

// Feature video
router.post(
  '/videos/:id/feature',
  authenticate,
  requireModeratorOrAdmin,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const video = await Video.findByPk(id);
      if (!video) {
        throw new NotFoundError('Video not found');
      }

      await video.update({
        featuredAt: video.featuredAt ? null : new Date()
      });

      await cacheDelete('featured:*');

      res.json({
        featured: !!video.featuredAt,
        video
      });
    } catch (error) {
      next(error);
    }
  }
);

// === Reports Management ===

// Get reports
router.get(
  '/reports',
  authenticate,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 50, status = 'pending', type } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;

      const { count, rows } = await Report.findAndCountAll({
        where,
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'username'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        reports: rows,
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
  }
);

// Review report
router.put(
  '/reports/:id/review',
  authenticate,
  requireModeratorOrAdmin,
  validate([
    param('id').isUUID().withMessage('Valid report ID required'),
    body('status').isIn(Object.values(ReportStatus)).withMessage('Invalid status'),
    body('resolution').optional().trim().isLength({ max: 1000 }).withMessage('Resolution max 1000 chars')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, resolution } = req.body;

      const report = await Report.findByPk(id);
      if (!report) {
        throw new NotFoundError('Report not found');
      }

      await report.update({
        status,
        resolution,
        reviewedBy: req.userId,
        reviewedAt: new Date()
      });

      logAudit('REPORT_REVIEWED', req.userId!, {
        reportId: id,
        status,
        resolution
      });

      res.json({ report });
    } catch (error) {
      next(error);
    }
  }
);

// === Dashboard Stats ===

router.get(
  '/stats',
  authenticate,
  requireModeratorOrAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalUsers,
        totalVideos,
        pendingReports,
        pendingVideos,
        newUsersToday,
        newVideosToday
      ] = await Promise.all([
        User.count(),
        Video.count({ where: { status: VideoStatus.READY } }),
        Report.count({ where: { status: ReportStatus.PENDING } }),
        Video.count({ where: { moderationStatus: 'pending' } }),
        User.count({
          where: {
            createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
        Video.count({
          where: {
            createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
            status: VideoStatus.READY
          }
        })
      ]);

      res.json({
        totalUsers,
        totalVideos,
        pendingReports,
        pendingVideos,
        newUsersToday,
        newVideosToday
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
