import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, requireRole, requireModeratorOrAdmin } from '../middleware/auth';
import { User, UserRole, Video, VideoStatus, Comment, CommentStatus, Report, ReportStatus, Category } from '../models';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { Op, fn, col } from 'sequelize';
import { cacheDelete } from '../config/redis';
import { logAudit } from '../utils/logger';
import bcrypt from 'bcryptjs';

const router = Router();

// === User Management ===

// Get all users
router.get(
  '/users',
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  authenticate as RequestHandler,
  requireRole(UserRole.ADMIN) as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid user ID required'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  authenticate as RequestHandler,
  requireRole(UserRole.ADMIN) as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid user ID required'),
    body('role').isIn(Object.values(UserRole)).withMessage('Invalid role')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  authenticate as RequestHandler,
  requireRole(UserRole.ADMIN) as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

// Admin reset user password
router.put(
  '/users/:id/reset-password',
  authenticate as RequestHandler,
  requireRole(UserRole.ADMIN) as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid user ID required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
      const passwordHash = await bcrypt.hash(password, salt);

      await user.update({ passwordHash });

      logAudit('ADMIN_PASSWORD_RESET', req.userId!, { targetUserId: id });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Delete user
router.delete(
  '/users/:id',
  authenticate as RequestHandler,
  requireRole(UserRole.ADMIN) as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (id === req.userId) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.destroy();

      logAudit('USER_DELETED', req.userId!, { deletedUserId: id, deletedEmail: user.email });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// === Category Management ===

// Create category
router.post(
  '/categories',
  authenticate as RequestHandler,
  requireRole(UserRole.ADMIN) as RequestHandler,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
    body('description').optional().trim(),
    body('icon').optional().trim(),
    body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
    body('isActive').optional().isBoolean()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, slug, description, icon, sortOrder, isActive } = req.body;

      // Check if slug already exists
      const existing = await Category.findOne({ where: { slug } });
      if (existing) {
        res.status(400).json({ error: { message: 'Category with this slug already exists' } });
        return;
      }

      const category = await Category.create({
        name,
        slug,
        description,
        icon,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false
      });

      logAudit('CATEGORY_CREATED', req.userId!, { categoryId: category.id, name });

      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  }
);

// Update category
router.put(
  '/categories/:id',
  authenticate as RequestHandler,
  requireRole(UserRole.ADMIN) as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid category ID required'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('slug').optional().trim().notEmpty().withMessage('Slug cannot be empty'),
    body('description').optional().trim(),
    body('icon').optional().trim(),
    body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
    body('isActive').optional().isBoolean()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, slug, description, icon, sortOrder, isActive } = req.body;

      const category = await Category.findByPk(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // If changing slug, check it doesn't already exist
      if (slug && slug !== category.slug) {
        const existing = await Category.findOne({ where: { slug } });
        if (existing) {
          res.status(400).json({ error: { message: 'Category with this slug already exists' } });
          return;
        }
      }

      await category.update({
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive })
      });

      logAudit('CATEGORY_UPDATED', req.userId!, { categoryId: id });

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }
);

// Delete category
router.delete(
  '/categories/:id',
  authenticate as RequestHandler,
  requireRole(UserRole.ADMIN) as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid category ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Check if category has videos
      const videoCount = await Video.count({ where: { categoryId: id } });
      if (videoCount > 0) {
        res.status(400).json({
          error: { message: `Cannot delete category with ${videoCount} videos. Reassign videos first.` }
        });
        return;
      }

      await category.destroy();

      logAudit('CATEGORY_DELETED', req.userId!, { categoryId: id, categoryName: category.name });

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// === Video Management ===

// Get all videos (including pending)
router.get(
  '/videos',
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 50, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;

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
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid video ID required'),
    body('action').isIn(['approve', 'reject', 'remove']).withMessage('Invalid action'),
    body('reason').optional().trim().isLength({ max: 1000 }).withMessage('Reason max 1000 chars')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const video = await Video.findByPk(id);
      if (!video) {
        throw new NotFoundError('Video not found');
      }

      const updates: any = {};

      switch (action) {
        case 'approve':
          updates.status = VideoStatus.READY;
          break;
        case 'reject':
        case 'remove':
          updates.status = VideoStatus.DELETED;
          break;
      }

      await video.update(updates);

      logAudit('VIDEO_MODERATED', req.userId!, {
        videoId: id,
        action
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
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid report ID required'),
    body('status').isIn(Object.values(ReportStatus)).withMessage('Invalid status'),
    body('resolution').optional().trim().isLength({ max: 1000 }).withMessage('Resolution max 1000 chars')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        Video.count({ where: { status: VideoStatus.PENDING } }),
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
