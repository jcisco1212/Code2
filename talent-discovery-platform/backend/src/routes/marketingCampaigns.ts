import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { NotFoundError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import MarketingCampaign, { CampaignStatus } from '../models/MarketingCampaign';
import SocialContent, { ContentStatus } from '../models/SocialContent';
import MarketingAnalytics from '../models/MarketingAnalytics';
import User from '../models/User';
import { sequelize } from '../config/database';

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

// Get all campaigns with optional filters
router.get(
  '/',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    query('status').optional().isIn(Object.values(CampaignStatus)),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;

      const { count, rows: campaigns } = await MarketingCampaign.findAndCountAll({
        where,
        include: [
          { model: User, as: 'creator', attributes: ['id', 'username', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      // Get content counts for each campaign
      const campaignsWithStats = await Promise.all(
        campaigns.map(async (campaign) => {
          const contentCount = await SocialContent.count({
            where: { campaignId: campaign.id }
          });
          const publishedCount = await SocialContent.count({
            where: { campaignId: campaign.id, status: ContentStatus.PUBLISHED }
          });
          return {
            ...campaign.toJSON(),
            stats: {
              totalContent: contentCount,
              publishedContent: publishedCount
            }
          };
        })
      );

      res.json({
        campaigns: campaignsWithStats,
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

// Get single campaign with its content
router.get(
  '/:id',
  authenticate as RequestHandler,
  isAdmin,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await MarketingCampaign.findByPk(req.params.id, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
          {
            model: SocialContent,
            as: 'content',
            order: [['scheduledAt', 'ASC']]
          }
        ]
      });

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      res.json({ campaign });
    } catch (error) {
      next(error);
    }
  }
);

// Create new campaign
router.post(
  '/',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    body('name').notEmpty().isLength({ max: 255 }),
    body('description').optional().isLength({ max: 5000 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('targetAudience').optional().isLength({ max: 2000 }),
    body('goals').optional().isLength({ max: 2000 }),
    body('budget').optional().isFloat({ min: 0 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, startDate, endDate, targetAudience, goals, budget } = req.body;

      const campaign = await MarketingCampaign.create({
        name,
        description: description || null,
        status: CampaignStatus.DRAFT,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        targetAudience: targetAudience || null,
        goals: goals || null,
        budget: budget || null,
        createdBy: req.userId!
      });

      res.status(201).json({ campaign });
    } catch (error) {
      next(error);
    }
  }
);

// Update campaign
router.put(
  '/:id',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    param('id').isUUID(),
    body('name').optional().isLength({ max: 255 }),
    body('description').optional().isLength({ max: 5000 }),
    body('status').optional().isIn(Object.values(CampaignStatus)),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('targetAudience').optional().isLength({ max: 2000 }),
    body('goals').optional().isLength({ max: 2000 }),
    body('budget').optional().isFloat({ min: 0 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await MarketingCampaign.findByPk(req.params.id);

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      const { name, description, status, startDate, endDate, targetAudience, goals, budget } = req.body;

      await campaign.update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(goals !== undefined && { goals }),
        ...(budget !== undefined && { budget })
      });

      res.json({ campaign });
    } catch (error) {
      next(error);
    }
  }
);

// Delete campaign
router.delete(
  '/:id',
  authenticate as RequestHandler,
  isAdmin,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await MarketingCampaign.findByPk(req.params.id);

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      // Remove campaign association from content (don't delete content)
      await SocialContent.update(
        { campaignId: null },
        { where: { campaignId: campaign.id } }
      );

      await campaign.destroy();

      res.json({ message: 'Campaign deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
