import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, requireAgent, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { User, UserRole, Video, VideoStatus, VideoVisibility, AgentBookmark, Message, Notification, NotificationType, Follow } from '../models';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler';
import { Op, fn, col, literal } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Agent Dashboard - Get talent discovery feed
router.get(
  '/discover',
  authenticate,
  requireAgent,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        minScore,
        maxAge,
        minAge,
        region,
        sortBy = 'trendingScore'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Build video filter
      const videoWhere: any = {
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC
      };

      if (category) {
        videoWhere.categoryId = category;
      }

      if (minScore) {
        videoWhere.aiPerformanceScore = { [Op.gte]: Number(minScore) };
      }

      // Build user filter
      const userWhere: any = {
        role: { [Op.in]: [UserRole.CREATOR, UserRole.USER] }
      };

      if (region) {
        userWhere.location = { [Op.iLike]: `%${region}%` };
      }

      // Get videos with user data
      const validSortFields = ['trendingScore', 'aiPerformanceScore', 'views', 'likes', 'createdAt'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'trendingScore';

      const { count, rows } = await Video.findAndCountAll({
        where: videoWhere,
        include: [
          {
            model: User,
            as: 'user',
            where: userWhere,
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl', 'bio', 'talentCategories', 'location', 'dateOfBirth']
          }
        ],
        order: [[sortField as string, 'DESC']],
        limit: Number(limit),
        offset,
        distinct: true
      });

      res.json({
        videos: rows.map(v => ({
          ...v.toPublicJSON(),
          user: (v as any).user
        })),
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

// Get AI-recommended talent for agent
router.get(
  '/recommended',
  authenticate,
  requireAgent,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 10 } = req.query;

      // Get agent's bookmarked talent categories for personalization
      const bookmarks = await AgentBookmark.findAll({
        where: { agentId: req.userId },
        include: [
          {
            model: User,
            as: 'talent',
            attributes: ['talentCategories']
          }
        ],
        limit: 50
      });

      // Extract preferred categories
      const preferredCategories: string[] = [];
      bookmarks.forEach((b: any) => {
        if (b.talent?.talentCategories) {
          preferredCategories.push(...b.talent.talentCategories);
        }
      });

      // Find similar talent not yet bookmarked
      const bookmarkedIds = bookmarks.map(b => b.talentId);

      const recommendedVideos = await Video.findAll({
        where: {
          status: VideoStatus.READY,
          visibility: VideoVisibility.PUBLIC,
          aiPerformanceScore: { [Op.gte]: 70 },
          userId: { [Op.notIn]: bookmarkedIds }
        },
        include: [
          {
            model: User,
            as: 'user',
            where: {
              role: { [Op.in]: [UserRole.CREATOR, UserRole.USER] }
            },
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl', 'bio', 'talentCategories', 'location']
          }
        ],
        order: [['aiPerformanceScore', 'DESC'], ['trendingScore', 'DESC']],
        limit: Number(limit)
      });

      res.json({
        recommended: recommendedVideos.map(v => ({
          ...v.toPublicJSON(),
          user: (v as any).user
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get rising talent
router.get(
  '/rising',
  authenticate,
  requireAgent,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 20, category, period = '7d' } = req.query;

      // Calculate date threshold
      const daysMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30 };
      const days = daysMap[period as string] || 7;
      const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const where: any = {
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC,
        createdAt: { [Op.gte]: dateThreshold }
      };

      if (category) {
        where.categoryId = category;
      }

      // Find videos with high engagement velocity
      const risingVideos = await Video.findAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl', 'talentCategories']
          }
        ],
        order: [
          ['engagementScore', 'DESC'],
          ['views', 'DESC']
        ],
        limit: Number(limit)
      });

      res.json({
        rising: risingVideos.map(v => ({
          ...v.toPublicJSON(),
          user: (v as any).user
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bookmark a talent
router.post(
  '/bookmarks',
  authenticate,
  requireAgent,
  validate([
    body('talentId').isUUID().withMessage('Valid talent ID required'),
    body('listName').optional().trim().isLength({ max: 100 }).withMessage('List name max 100 chars'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes max 1000 chars'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { talentId, listName, notes, rating } = req.body;

      const talent = await User.findByPk(talentId);
      if (!talent) {
        throw new NotFoundError('User not found');
      }

      // Check if already bookmarked
      const existing = await AgentBookmark.findOne({
        where: {
          agentId: req.userId,
          talentId
        }
      });

      if (existing) {
        await existing.update({ listName, notes, rating });
        res.json({ bookmark: existing });
        return;
      }

      const bookmark = await AgentBookmark.create({
        agentId: req.userId!,
        talentId,
        listName,
        notes,
        rating
      });

      // Notify the talent
      await Notification.create({
        userId: talentId,
        type: NotificationType.AGENT_BOOKMARK,
        title: 'An agent bookmarked you!',
        message: `${req.user!.agencyName || 'An entertainment agent'} has bookmarked your profile`,
        data: { agentId: req.userId }
      });

      res.status(201).json({ bookmark });
    } catch (error) {
      next(error);
    }
  }
);

// Get agent's bookmarks
router.get(
  '/bookmarks',
  authenticate,
  requireAgent,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { listName, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = { agentId: req.userId };
      if (listName) {
        where.listName = listName;
      }

      const { count, rows } = await AgentBookmark.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'talent',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl', 'bio', 'talentCategories', 'location']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        bookmarks: rows,
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

// Get bookmark lists
router.get(
  '/bookmarks/lists',
  authenticate,
  requireAgent,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lists = await AgentBookmark.findAll({
        where: { agentId: req.userId },
        attributes: [
          'listName',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['listName']
      });

      res.json({ lists });
    } catch (error) {
      next(error);
    }
  }
);

// Remove bookmark
router.delete(
  '/bookmarks/:talentId',
  authenticate,
  requireAgent,
  validate([
    param('talentId').isUUID().withMessage('Valid talent ID required')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { talentId } = req.params;

      await AgentBookmark.destroy({
        where: {
          agentId: req.userId,
          talentId
        }
      });

      res.json({ message: 'Bookmark removed' });
    } catch (error) {
      next(error);
    }
  }
);

// Send message to talent
router.post(
  '/message',
  authenticate,
  requireAgent,
  validate([
    body('talentId').isUUID().withMessage('Valid talent ID required'),
    body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message required (1-5000 chars)')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { talentId, content } = req.body;

      const talent = await User.findByPk(talentId);
      if (!talent) {
        throw new NotFoundError('User not found');
      }

      // Create or get conversation ID
      const existingMessage = await Message.findOne({
        where: {
          [Op.or]: [
            { senderId: req.userId, receiverId: talentId },
            { senderId: talentId, receiverId: req.userId }
          ]
        }
      });

      const conversationId = existingMessage?.conversationId || uuidv4();

      const message = await Message.create({
        senderId: req.userId!,
        receiverId: talentId,
        conversationId,
        content,
        isAgentMessage: true
      });

      // Notify talent
      await Notification.create({
        userId: talentId,
        type: NotificationType.AGENT_MESSAGE,
        title: 'New message from an agent',
        message: `${req.user!.agencyName || 'An entertainment agent'} sent you a message`,
        data: { messageId: message.id, agentId: req.userId }
      });

      res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  }
);

// Get talent lists (curated)
router.get(
  '/talent-lists',
  authenticate,
  requireAgent,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get top performers by category
      const categories = ['singer', 'actor', 'dancer', 'comedian', 'voice-over'];

      const lists = await Promise.all(
        categories.map(async (category) => {
          const videos = await Video.findAll({
            where: {
              status: VideoStatus.READY,
              visibility: VideoVisibility.PUBLIC,
              aiCategoryTags: { [Op.contains]: [category] },
              aiPerformanceScore: { [Op.gte]: 75 }
            },
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl']
              }
            ],
            order: [['aiPerformanceScore', 'DESC']],
            limit: 10
          });

          return {
            name: `Top Rising ${category.charAt(0).toUpperCase() + category.slice(1)}s`,
            category,
            talents: videos.map(v => ({
              video: v.toPublicJSON(),
              user: (v as any).user
            }))
          };
        })
      );

      res.json({ lists });
    } catch (error) {
      next(error);
    }
  }
);

// Get trend reports
router.get(
  '/trends',
  authenticate,
  requireAgent,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period = '7d' } = req.query;

      const daysMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30 };
      const days = daysMap[period as string] || 7;
      const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get trending categories
      const categoryStats = await Video.findAll({
        where: {
          createdAt: { [Op.gte]: dateThreshold },
          status: VideoStatus.READY
        },
        attributes: [
          'categoryId',
          [fn('COUNT', col('id')), 'videoCount'],
          [fn('SUM', col('views')), 'totalViews'],
          [fn('AVG', col('ai_performance_score')), 'avgScore']
        ],
        group: ['categoryId'],
        order: [[fn('SUM', col('views')), 'DESC']],
        limit: 10
      });

      res.json({
        period,
        trends: {
          categories: categoryStats
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
