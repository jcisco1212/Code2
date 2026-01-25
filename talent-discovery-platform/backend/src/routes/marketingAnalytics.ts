import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { NotFoundError } from '../middleware/errorHandler';
import { Op, fn, col, literal } from 'sequelize';
import MarketingAnalytics, { MetricType } from '../models/MarketingAnalytics';
import SocialContent, { SocialPlatform, ContentStatus } from '../models/SocialContent';
import MarketingCampaign from '../models/MarketingCampaign';
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

// Get dashboard overview
router.get(
  '/dashboard',
  authenticate as RequestHandler,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Content statistics
      const totalContent = await SocialContent.count();
      const publishedContent = await SocialContent.count({
        where: { status: ContentStatus.PUBLISHED }
      });
      const scheduledContent = await SocialContent.count({
        where: { status: ContentStatus.SCHEDULED }
      });
      const draftContent = await SocialContent.count({
        where: { status: ContentStatus.DRAFT }
      });

      // Content by platform
      const contentByPlatform = await SocialContent.findAll({
        attributes: [
          'platform',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['platform'],
        raw: true
      });

      // Campaign statistics
      const totalCampaigns = await MarketingCampaign.count();
      const activeCampaigns = await MarketingCampaign.count({
        where: { status: 'active' }
      });

      // Recent activity
      const recentContent = await SocialContent.findAll({
        where: {
          createdAt: { [Op.gte]: sevenDaysAgo }
        },
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'title', 'platform', 'status', 'createdAt']
      });

      // Upcoming scheduled posts
      const upcomingPosts = await SocialContent.findAll({
        where: {
          status: ContentStatus.SCHEDULED,
          scheduledAt: { [Op.gte]: now }
        },
        order: [['scheduledAt', 'ASC']],
        limit: 5,
        attributes: ['id', 'title', 'platform', 'scheduledAt']
      });

      // Analytics summary (if any data exists)
      const analyticsSummary = await MarketingAnalytics.findAll({
        where: {
          recordedAt: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          'metricType',
          [fn('SUM', col('metricValue')), 'total']
        ],
        group: ['metricType'],
        raw: true
      });

      res.json({
        content: {
          total: totalContent,
          published: publishedContent,
          scheduled: scheduledContent,
          draft: draftContent,
          byPlatform: contentByPlatform
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns
        },
        recentActivity: recentContent,
        upcomingPosts,
        analytics: analyticsSummary
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get analytics by platform
router.get(
  '/by-platform',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('platform').optional().isIn(Object.values(SocialPlatform))
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, platform } = req.query;
      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const where: any = {
        recordedAt: {
          [Op.gte]: startDate ? new Date(startDate as string) : defaultStartDate,
          [Op.lte]: endDate ? new Date(endDate as string) : now
        }
      };

      if (platform) {
        where.platform = platform;
      }

      const analytics = await MarketingAnalytics.findAll({
        where,
        attributes: [
          'platform',
          'metricType',
          [fn('SUM', col('metricValue')), 'total'],
          [fn('AVG', col('metricValue')), 'average'],
          [fn('COUNT', col('id')), 'dataPoints']
        ],
        group: ['platform', 'metricType'],
        raw: true
      });

      // Organize by platform
      const byPlatform: Record<string, any> = {};
      (analytics as any[]).forEach((row) => {
        if (!byPlatform[row.platform]) {
          byPlatform[row.platform] = {};
        }
        byPlatform[row.platform][row.metricType] = {
          total: parseFloat(row.total),
          average: parseFloat(row.average),
          dataPoints: parseInt(row.dataPoints)
        };
      });

      res.json({ analytics: byPlatform });
    } catch (error) {
      next(error);
    }
  }
);

// Get analytics for a specific campaign
router.get(
  '/campaign/:id',
  authenticate as RequestHandler,
  isAdmin,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await MarketingCampaign.findByPk(req.params.id);

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      const analytics = await MarketingAnalytics.findAll({
        where: { campaignId: req.params.id },
        attributes: [
          'platform',
          'metricType',
          [fn('SUM', col('metricValue')), 'total'],
          [fn('AVG', col('metricValue')), 'average']
        ],
        group: ['platform', 'metricType'],
        raw: true
      });

      // Get content performance for this campaign
      const contentPerformance = await SocialContent.findAll({
        where: { campaignId: req.params.id },
        include: [
          {
            model: MarketingAnalytics,
            as: 'analytics',
            attributes: ['metricType', 'metricValue', 'recordedAt']
          }
        ]
      });

      res.json({
        campaign,
        analytics,
        contentPerformance
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get time series data for charting
router.get(
  '/time-series',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('metricType').optional().isIn(Object.values(MetricType)),
    query('platform').optional().isIn(Object.values(SocialPlatform)),
    query('interval').optional().isIn(['day', 'week', 'month'])
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, metricType, platform, interval = 'day' } = req.query;
      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const where: any = {
        recordedAt: {
          [Op.gte]: startDate ? new Date(startDate as string) : defaultStartDate,
          [Op.lte]: endDate ? new Date(endDate as string) : now
        }
      };

      if (metricType) where.metricType = metricType;
      if (platform) where.platform = platform;

      // Date truncation based on interval
      let dateFormat: string;
      switch (interval) {
        case 'week':
          dateFormat = 'YYYY-IW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      const timeSeries = await MarketingAnalytics.findAll({
        where,
        attributes: [
          [fn('to_char', col('recorded_at'), dateFormat), 'period'],
          'metricType',
          [fn('SUM', col('metricValue')), 'total']
        ],
        group: [literal(`to_char(recorded_at, '${dateFormat}')`), 'metricType'],
        order: [[literal(`to_char(recorded_at, '${dateFormat}')`), 'ASC']],
        raw: true
      });

      res.json({ timeSeries });
    } catch (error) {
      next(error);
    }
  }
);

// Record analytics data manually
router.post(
  '/',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    body('contentId').optional().isUUID(),
    body('campaignId').optional().isUUID(),
    body('platform').notEmpty().isIn(Object.values(SocialPlatform)),
    body('metricType').notEmpty().isIn(Object.values(MetricType)),
    body('metricValue').notEmpty().isFloat({ min: 0 }),
    body('recordedAt').optional().isISO8601(),
    body('metadata').optional().isObject()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { contentId, campaignId, platform, metricType, metricValue, recordedAt, metadata } = req.body;

      // Validate content exists if provided
      if (contentId) {
        const content = await SocialContent.findByPk(contentId);
        if (!content) {
          throw new NotFoundError('Content not found');
        }
      }

      // Validate campaign exists if provided
      if (campaignId) {
        const campaign = await MarketingCampaign.findByPk(campaignId);
        if (!campaign) {
          throw new NotFoundError('Campaign not found');
        }
      }

      const analytics = await MarketingAnalytics.create({
        contentId: contentId || null,
        campaignId: campaignId || null,
        platform,
        metricType,
        metricValue,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        metadata: metadata || null
      });

      res.status(201).json({ analytics });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk record analytics
router.post(
  '/bulk',
  authenticate as RequestHandler,
  isAdmin,
  validate([
    body('data').isArray({ min: 1 }),
    body('data.*.platform').notEmpty().isIn(Object.values(SocialPlatform)),
    body('data.*.metricType').notEmpty().isIn(Object.values(MetricType)),
    body('data.*.metricValue').notEmpty().isFloat({ min: 0 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { data } = req.body;

      const records = data.map((item: any) => ({
        contentId: item.contentId || null,
        campaignId: item.campaignId || null,
        platform: item.platform,
        metricType: item.metricType,
        metricValue: item.metricValue,
        recordedAt: item.recordedAt ? new Date(item.recordedAt) : new Date(),
        metadata: item.metadata || null
      }));

      const analytics = await MarketingAnalytics.bulkCreate(records);

      res.status(201).json({
        message: `${analytics.length} records created`,
        count: analytics.length
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
