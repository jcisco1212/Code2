import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, requireRole, requireModeratorOrAdmin, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { User, UserRole, Video, VideoStatus, Comment, CommentStatus, Report, ReportStatus, Category } from '../models';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { Op, fn, col, literal } from 'sequelize';
import { cacheDelete } from '../config/redis';
import { logAudit } from '../utils/logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import ExcelJS from 'exceljs';

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

// Create new user (admin can create users and agents, only super admin can create admins)
router.post(
  '/users',
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('username')
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-50 characters, alphanumeric and underscores only'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('First name required'),
    body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('Last name required'),
    body('role').isIn(['user', 'creator', 'agent', 'admin', 'super_admin']).withMessage('Invalid role'),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
    body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth required'),
    body('ethnicity').optional().trim().isLength({ max: 100 }).withMessage('Ethnicity max 100 chars'),
    body('location').optional().trim().isLength({ max: 255 }).withMessage('Location max 255 chars')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const {
        email,
        username,
        password,
        firstName,
        lastName,
        role,
        gender,
        dateOfBirth,
        ethnicity,
        location
      } = req.body;

      // Only super admins can create admin or super_admin accounts
      if ((role === 'admin' || role === 'super_admin') && authReq.user?.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({ error: { message: 'Only Super Admins can create admin accounts' } });
        return;
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        res.status(400).json({ error: { message: 'Email already registered' } });
        return;
      }

      // Check if username already exists
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        res.status(400).json({ error: { message: 'Username already taken' } });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const displayName = firstName && lastName ? `${firstName} ${lastName}` : username;

      const user = await User.create({
        email,
        username,
        passwordHash,
        displayName,
        firstName,
        lastName,
        role: role as UserRole,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        ethnicity: ethnicity || null,
        location: location || null,
        emailVerified: true, // Admin-created accounts are pre-verified
        isActive: true
      });

      logAudit('ADMIN_USER_CREATED', authReq.userId!, {
        createdUserId: user.id,
        email,
        role
      });

      res.status(201).json({
        message: 'User created successfully',
        user: user.toPublicJSON()
      });
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

// === User Reports & Data Export ===

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: Date | null): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Helper function to parse location into city and state
const parseLocation = (location: string | null): { city: string; state: string } => {
  if (!location) return { city: '', state: '' };
  const parts = location.split(',').map(p => p.trim());
  return {
    city: parts[0] || '',
    state: parts[1] || ''
  };
};

// Get user report data with filters
router.get(
  '/reports/users',
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 100,
        role,
        gender,
        ethnicity,
        minAge,
        maxAge,
        state,
        city,
        startDate,
        endDate,
        search,
        talentCategory,
        artistType,
        genre,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Role filter
      if (role) where.role = role;

      // Gender filter
      if (gender) where.gender = gender;

      // Ethnicity filter
      if (ethnicity) where.ethnicity = ethnicity;

      // Location filters (city/state)
      if (city || state) {
        const locationFilters: any[] = [];
        if (city) locationFilters.push({ location: { [Op.iLike]: `${city}%` } });
        if (state) locationFilters.push({ location: { [Op.iLike]: `%${state}%` } });
        where[Op.and] = locationFilters;
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate as string);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate as string);
      }

      // Age range filter (calculated from dateOfBirth)
      if (minAge || maxAge) {
        const today = new Date();
        if (maxAge) {
          const minBirthDate = new Date(today.getFullYear() - Number(maxAge) - 1, today.getMonth(), today.getDate());
          where.dateOfBirth = { ...where.dateOfBirth, [Op.gte]: minBirthDate };
        }
        if (minAge) {
          const maxBirthDate = new Date(today.getFullYear() - Number(minAge), today.getMonth(), today.getDate());
          where.dateOfBirth = { ...where.dateOfBirth, [Op.lte]: maxBirthDate };
        }
      }

      // Artist type filter
      if (artistType) where.artistType = artistType;

      // Genre filter
      if (genre) where.genre = { [Op.iLike]: `%${genre}%` };

      // Talent category filter
      if (talentCategory) {
        where.talentCategories = { [Op.contains]: [talentCategory] };
      }

      // Search filter
      if (search) {
        where[Op.or] = [
          { email: { [Op.iLike]: `%${search}%` } },
          { username: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Valid sort fields
      const validSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'username', 'dateOfBirth', 'role'];
      const orderField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
      const orderDir = (sortOrder as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: [
          'id', 'firstName', 'lastName', 'username', 'email', 'role',
          'gender', 'dateOfBirth', 'ethnicity', 'location',
          'artistType', 'genre', 'talentCategories',
          'isActive', 'isVerified', 'emailVerified',
          'createdAt', 'lastLoginAt'
        ],
        order: [[orderField as string, orderDir]],
        limit: Number(limit),
        offset
      });

      // Transform data to include calculated fields
      const users = rows.map(user => {
        const userData = user.toJSON() as any;
        const { city, state } = parseLocation(userData.location);
        return {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          username: userData.username,
          email: userData.email,
          role: userData.role,
          gender: userData.gender,
          dateOfBirth: userData.dateOfBirth,
          age: calculateAge(userData.dateOfBirth),
          ethnicity: userData.ethnicity,
          city,
          state,
          location: userData.location,
          artistType: userData.artistType,
          genre: userData.genre,
          talentCategories: userData.talentCategories,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
          emailVerified: userData.emailVerified,
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt
        };
      });

      res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        },
        filters: {
          role, gender, ethnicity, minAge, maxAge, state, city,
          startDate, endDate, talentCategory, artistType, genre
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export user report to CSV or Excel
router.get(
  '/reports/users/export',
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        format = 'csv',
        role,
        gender,
        ethnicity,
        minAge,
        maxAge,
        state,
        city,
        startDate,
        endDate,
        talentCategory,
        artistType,
        genre
      } = req.query;

      const where: any = {};

      // Apply same filters as the report endpoint
      if (role) where.role = role;
      if (gender) where.gender = gender;
      if (ethnicity) where.ethnicity = ethnicity;

      if (city || state) {
        const locationFilters: any[] = [];
        if (city) locationFilters.push({ location: { [Op.iLike]: `${city}%` } });
        if (state) locationFilters.push({ location: { [Op.iLike]: `%${state}%` } });
        where[Op.and] = locationFilters;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate as string);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate as string);
      }

      if (minAge || maxAge) {
        const today = new Date();
        if (maxAge) {
          const minBirthDate = new Date(today.getFullYear() - Number(maxAge) - 1, today.getMonth(), today.getDate());
          where.dateOfBirth = { ...where.dateOfBirth, [Op.gte]: minBirthDate };
        }
        if (minAge) {
          const maxBirthDate = new Date(today.getFullYear() - Number(minAge), today.getMonth(), today.getDate());
          where.dateOfBirth = { ...where.dateOfBirth, [Op.lte]: maxBirthDate };
        }
      }

      if (artistType) where.artistType = artistType;
      if (genre) where.genre = { [Op.iLike]: `%${genre}%` };
      if (talentCategory) where.talentCategories = { [Op.contains]: [talentCategory] };

      // Fetch all matching users (no pagination for export)
      const users = await User.findAll({
        where,
        attributes: [
          'id', 'firstName', 'lastName', 'username', 'email', 'role',
          'gender', 'dateOfBirth', 'ethnicity', 'location',
          'artistType', 'genre', 'talentCategories',
          'isActive', 'isVerified', 'emailVerified',
          'createdAt', 'lastLoginAt'
        ],
        order: [['createdAt', 'DESC']]
      });

      // Transform data
      const reportData = users.map(user => {
        const userData = user.toJSON() as any;
        const { city, state } = parseLocation(userData.location);
        return {
          'Full Name': `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          'First Name': userData.firstName || '',
          'Last Name': userData.lastName || '',
          'Username': userData.username,
          'Email': userData.email,
          'Role': userData.role,
          'Gender': userData.gender || '',
          'Date of Birth': userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : '',
          'Age': calculateAge(userData.dateOfBirth) || '',
          'Ethnicity': userData.ethnicity || '',
          'City': city,
          'State': state,
          'Artist Type': userData.artistType || '',
          'Genre': userData.genre || '',
          'Talent Categories': (userData.talentCategories || []).join(', '),
          'Account Status': userData.isActive ? 'Active' : 'Inactive',
          'Email Verified': userData.emailVerified ? 'Yes' : 'No',
          'Account Verified': userData.isVerified ? 'Yes' : 'No',
          'Registration Date': userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '',
          'Last Login': userData.lastLoginAt ? new Date(userData.lastLoginAt).toLocaleDateString() : 'Never'
        };
      });

      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'excel' || format === 'xlsx') {
        // Generate Excel file
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'TalentVault Admin';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('User Report');

        // Define columns
        worksheet.columns = [
          { header: 'Full Name', key: 'Full Name', width: 25 },
          { header: 'First Name', key: 'First Name', width: 15 },
          { header: 'Last Name', key: 'Last Name', width: 15 },
          { header: 'Username', key: 'Username', width: 20 },
          { header: 'Email', key: 'Email', width: 30 },
          { header: 'Role', key: 'Role', width: 12 },
          { header: 'Gender', key: 'Gender', width: 12 },
          { header: 'Date of Birth', key: 'Date of Birth', width: 15 },
          { header: 'Age', key: 'Age', width: 8 },
          { header: 'Ethnicity', key: 'Ethnicity', width: 25 },
          { header: 'City', key: 'City', width: 20 },
          { header: 'State', key: 'State', width: 15 },
          { header: 'Artist Type', key: 'Artist Type', width: 12 },
          { header: 'Genre', key: 'Genre', width: 15 },
          { header: 'Talent Categories', key: 'Talent Categories', width: 30 },
          { header: 'Account Status', key: 'Account Status', width: 15 },
          { header: 'Email Verified', key: 'Email Verified', width: 15 },
          { header: 'Account Verified', key: 'Account Verified', width: 15 },
          { header: 'Registration Date', key: 'Registration Date', width: 18 },
          { header: 'Last Login', key: 'Last Login', width: 15 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F46E5' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Add data rows
        reportData.forEach(row => {
          worksheet.addRow(row);
        });

        // Add filters
        worksheet.autoFilter = {
          from: 'A1',
          to: `T${reportData.length + 1}`
        };

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=user-report-${timestamp}.xlsx`);
        res.send(buffer);
      } else {
        // Generate CSV
        const headers = Object.keys(reportData[0] || {});
        const csvRows = [
          headers.join(','),
          ...reportData.map(row =>
            headers.map(header => {
              const value = (row as any)[header];
              // Escape quotes and wrap in quotes if contains comma
              const escaped = String(value).replace(/"/g, '""');
              return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
                ? `"${escaped}"`
                : escaped;
            }).join(',')
          )
        ];

        const csvContent = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=user-report-${timestamp}.csv`);
        res.send(csvContent);
      }

      logAudit('USER_REPORT_EXPORTED', req.userId!, {
        format,
        recordCount: reportData.length,
        filters: { role, gender, ethnicity, minAge, maxAge, state, city, startDate, endDate }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get report summary statistics
router.get(
  '/reports/users/summary',
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get counts by role
      const roleStats = await User.findAll({
        attributes: ['role', [fn('COUNT', col('id')), 'count']],
        group: ['role'],
        raw: true
      });

      // Get counts by gender
      const genderStats = await User.findAll({
        attributes: ['gender', [fn('COUNT', col('id')), 'count']],
        group: ['gender'],
        raw: true
      });

      // Get counts by ethnicity
      const ethnicityStats = await User.findAll({
        attributes: ['ethnicity', [fn('COUNT', col('id')), 'count']],
        group: ['ethnicity'],
        raw: true
      });

      // Get total users
      const totalUsers = await User.count();

      // Get users registered in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsersLast30Days = await User.count({
        where: { createdAt: { [Op.gte]: thirtyDaysAgo } }
      });

      // Get active vs inactive
      const activeUsers = await User.count({ where: { isActive: true } });
      const inactiveUsers = await User.count({ where: { isActive: false } });

      // Get verified vs unverified
      const verifiedEmails = await User.count({ where: { emailVerified: true } });

      res.json({
        totalUsers,
        newUsersLast30Days,
        activeUsers,
        inactiveUsers,
        verifiedEmails,
        unverifiedEmails: totalUsers - verifiedEmails,
        byRole: roleStats,
        byGender: genderStats,
        byEthnicity: ethnicityStats
      });
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
