import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { NotFoundError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import SocialContent, { SocialPlatform, ContentStatus, ContentType } from '../models/SocialContent';
import MarketingCampaign from '../models/MarketingCampaign';
import User from '../models/User';

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

// Get all social content with filters
router.get(
  '/',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    query('status').optional().isIn(Object.values(ContentStatus)),
    query('platform').optional().isIn(Object.values(SocialPlatform)),
    query('campaignId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, platform, campaignId, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;
      if (platform) where.platform = platform;
      if (campaignId) where.campaignId = campaignId;

      const { count, rows: content } = await SocialContent.findAndCountAll({
        where,
        include: [
          { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
          { model: MarketingCampaign, as: 'campaign', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        content,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get scheduled content (calendar view)
router.get(
  '/calendar',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const where: any = {
        status: { [Op.in]: [ContentStatus.SCHEDULED, ContentStatus.PUBLISHED] },
        scheduledAt: { [Op.not]: null }
      };

      if (startDate) {
        where.scheduledAt = { ...where.scheduledAt, [Op.gte]: new Date(startDate as string) };
      }
      if (endDate) {
        where.scheduledAt = { ...where.scheduledAt, [Op.lte]: new Date(endDate as string) };
      }

      const content = await SocialContent.findAll({
        where,
        include: [
          { model: MarketingCampaign, as: 'campaign', attributes: ['id', 'name'] }
        ],
        order: [['scheduledAt', 'ASC']]
      });

      res.json({ content });
    } catch (error) {
      next(error);
    }
  }
);

// Get single content by ID
router.get(
  '/:id',
  authenticate as RequestHandler,
  isAdmin,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const content = await SocialContent.findByPk(req.params.id, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
          { model: MarketingCampaign, as: 'campaign' }
        ]
      });

      if (!content) {
        throw new NotFoundError('Content not found');
      }

      res.json({ content });
    } catch (error) {
      next(error);
    }
  }
);

// Create new content
router.post(
  '/',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    body('title').notEmpty().isLength({ max: 255 }),
    body('content').notEmpty().isLength({ max: 10000 }),
    body('platform').notEmpty().isIn(Object.values(SocialPlatform)),
    body('contentType').optional().isIn(Object.values(ContentType)),
    body('mediaUrls').optional().isArray(),
    body('linkUrl').optional().isURL(),
    body('hashtags').optional().isArray(),
    body('scheduledAt').optional().isISO8601(),
    body('campaignId').optional().isUUID(),
    body('notes').optional().isLength({ max: 5000 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        title,
        content,
        platform,
        contentType = ContentType.TEXT,
        mediaUrls,
        linkUrl,
        hashtags,
        scheduledAt,
        campaignId,
        notes
      } = req.body;

      // Validate campaign exists if provided
      if (campaignId) {
        const campaign = await MarketingCampaign.findByPk(campaignId);
        if (!campaign) {
          throw new NotFoundError('Campaign not found');
        }
      }

      const socialContent = await SocialContent.create({
        title,
        content,
        platform,
        contentType,
        status: scheduledAt ? ContentStatus.SCHEDULED : ContentStatus.DRAFT,
        mediaUrls: mediaUrls || null,
        linkUrl: linkUrl || null,
        hashtags: hashtags || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        campaignId: campaignId || null,
        createdBy: req.userId!,
        notes: notes || null
      });

      res.status(201).json({ content: socialContent });
    } catch (error) {
      next(error);
    }
  }
);

// Update content
router.put(
  '/:id',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    param('id').isUUID(),
    body('title').optional().isLength({ max: 255 }),
    body('content').optional().isLength({ max: 10000 }),
    body('platform').optional().isIn(Object.values(SocialPlatform)),
    body('contentType').optional().isIn(Object.values(ContentType)),
    body('status').optional().isIn(Object.values(ContentStatus)),
    body('mediaUrls').optional().isArray(),
    body('linkUrl').optional().isURL(),
    body('hashtags').optional().isArray(),
    body('scheduledAt').optional().isISO8601(),
    body('campaignId').optional().isUUID(),
    body('notes').optional().isLength({ max: 5000 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const socialContent = await SocialContent.findByPk(req.params.id);

      if (!socialContent) {
        throw new NotFoundError('Content not found');
      }

      const {
        title,
        content,
        platform,
        contentType,
        status,
        mediaUrls,
        linkUrl,
        hashtags,
        scheduledAt,
        campaignId,
        notes
      } = req.body;

      // Validate campaign exists if provided
      if (campaignId) {
        const campaign = await MarketingCampaign.findByPk(campaignId);
        if (!campaign) {
          throw new NotFoundError('Campaign not found');
        }
      }

      await socialContent.update({
        ...(title && { title }),
        ...(content && { content }),
        ...(platform && { platform }),
        ...(contentType && { contentType }),
        ...(status && { status }),
        ...(mediaUrls !== undefined && { mediaUrls }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(hashtags !== undefined && { hashtags }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(campaignId !== undefined && { campaignId }),
        ...(notes !== undefined && { notes })
      });

      res.json({ content: socialContent });
    } catch (error) {
      next(error);
    }
  }
);

// Mark content as published
router.post(
  '/:id/publish',
  authenticate as RequestHandler,
  isAdmin,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const socialContent = await SocialContent.findByPk(req.params.id);

      if (!socialContent) {
        throw new NotFoundError('Content not found');
      }

      await socialContent.update({
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date()
      });

      res.json({ content: socialContent, message: 'Content marked as published' });
    } catch (error) {
      next(error);
    }
  }
);

// Duplicate content
router.post(
  '/:id/duplicate',
  authenticate as RequestHandler,
  isAdmin,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const original = await SocialContent.findByPk(req.params.id);

      if (!original) {
        throw new NotFoundError('Content not found');
      }

      const duplicate = await SocialContent.create({
        title: `${original.title} (Copy)`,
        content: original.content,
        platform: original.platform,
        contentType: original.contentType,
        status: ContentStatus.DRAFT,
        mediaUrls: original.mediaUrls,
        linkUrl: original.linkUrl,
        hashtags: original.hashtags,
        scheduledAt: null,
        campaignId: original.campaignId,
        createdBy: req.userId!,
        notes: original.notes
      });

      res.status(201).json({ content: duplicate });
    } catch (error) {
      next(error);
    }
  }
);

// Delete content
router.delete(
  '/:id',
  authenticate as RequestHandler,
  isAdmin,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const content = await SocialContent.findByPk(req.params.id);

      if (!content) {
        throw new NotFoundError('Content not found');
      }

      await content.destroy();

      res.json({ message: 'Content deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
