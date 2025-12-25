import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { query, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { optionalAuth } from '../middleware/auth';
import { Video, VideoStatus, VideoVisibility, User } from '../models';
import { Op } from 'sequelize';

const router = Router();

// Get all clips (short-form videos)
router.get(
  '/',
  optionalAuth as RequestHandler,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Invalid page'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Invalid limit'),
    query('categoryId').optional().isUUID().withMessage('Invalid category ID'),
    query('sortBy').optional().isIn(['trending', 'recent', 'popular']).withMessage('Invalid sort')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 20, categoryId, sortBy = 'trending' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {
        isClip: true,
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      // Determine sort order
      let order: any[];
      switch (sortBy) {
        case 'recent':
          order = [['createdAt', 'DESC']];
          break;
        case 'popular':
          order = [['viewsCount', 'DESC']];
          break;
        case 'trending':
        default:
          order = [['trendingScore', 'DESC'], ['createdAt', 'DESC']];
          break;
      }

      const { count, rows } = await Video.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'avatarUrl', 'isVerified']
          }
        ],
        order,
        limit: Number(limit),
        offset
      });

      res.json({
        clips: rows.map(v => ({
          ...v.toPublicJSON(),
          creator: (v as any).user
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

// Get trending clips
router.get(
  '/trending',
  optionalAuth as RequestHandler,
  validate([
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Invalid limit')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 10 } = req.query;

      const clips = await Video.findAll({
        where: {
          isClip: true,
          status: VideoStatus.READY,
          visibility: VideoVisibility.PUBLIC
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'avatarUrl', 'isVerified']
          }
        ],
        order: [['trendingScore', 'DESC'], ['viewsCount', 'DESC']],
        limit: Number(limit)
      });

      res.json({
        clips: clips.map(v => ({
          ...v.toPublicJSON(),
          creator: (v as any).user
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get clips by user
router.get(
  '/user/:userId',
  optionalAuth as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Invalid page'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Invalid limit')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const isOwner = req.userId === userId;

      const where: any = {
        userId,
        isClip: true,
        status: VideoStatus.READY
      };

      if (!isOwner) {
        where.visibility = VideoVisibility.PUBLIC;
      }

      const { count, rows } = await Video.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'avatarUrl', 'isVerified']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        clips: rows.map(v => ({
          ...v.toPublicJSON(),
          creator: (v as any).user
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

export default router;
