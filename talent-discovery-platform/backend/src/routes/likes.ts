import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { Like, LikeType, LikeTarget, Video, Comment } from '../models';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const router = Router();

// Like/unlike a video
router.post(
  '/video/:videoId',
  authenticate as RequestHandler,
  validate([
    param('videoId').isUUID().withMessage('Valid video ID required'),
    body('type').optional().isIn(['like', 'dislike']).withMessage('Type must be like or dislike')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.params;
      const { type = 'like' } = req.body;

      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }

      // Check for existing like
      const existingLike = await Like.findOne({
        where: {
          userId: req.userId,
          targetId: videoId,
          targetType: LikeTarget.VIDEO
        }
      });

      if (existingLike) {
        if (existingLike.type === type) {
          // Remove like
          await existingLike.destroy();
          if (type === 'like') {
            await video.decrement('likes');
          } else {
            await video.decrement('dislikes');
          }
          res.json({ liked: false, type: null });
        } else {
          // Change like type
          const oldType = existingLike.type;
          await existingLike.update({ type });

          if (oldType === 'like') {
            await video.decrement('likes');
            await video.increment('dislikes');
          } else {
            await video.increment('likes');
            await video.decrement('dislikes');
          }

          res.json({ liked: true, type });
        }
      } else {
        // Create new like
        await Like.create({
          userId: req.userId!,
          targetId: videoId,
          targetType: LikeTarget.VIDEO,
          type
        });

        if (type === 'like') {
          await video.increment('likes');
        } else {
          await video.increment('dislikes');
        }

        res.json({ liked: true, type });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Like/unlike a comment
router.post(
  '/comment/:commentId',
  authenticate as RequestHandler,
  validate([
    param('commentId').isUUID().withMessage('Valid comment ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { commentId } = req.params;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        throw new NotFoundError('Comment not found');
      }

      // Check for existing like
      const existingLike = await Like.findOne({
        where: {
          userId: req.userId,
          targetId: commentId,
          targetType: LikeTarget.COMMENT
        }
      });

      if (existingLike) {
        await existingLike.destroy();
        await comment.decrement('likes');
        res.json({ liked: false });
      } else {
        await Like.create({
          userId: req.userId!,
          targetId: commentId,
          targetType: LikeTarget.COMMENT,
          type: LikeType.LIKE
        });
        await comment.increment('likes');
        res.json({ liked: true });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Get like status for multiple videos
router.post(
  '/status/videos',
  authenticate as RequestHandler,
  validate([
    body('videoIds').isArray({ min: 1, max: 100 }).withMessage('Video IDs array required (1-100 items)')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoIds } = req.body;

      const likes = await Like.findAll({
        where: {
          userId: req.userId,
          targetId: videoIds,
          targetType: LikeTarget.VIDEO
        }
      });

      const likeMap: Record<string, string | null> = {};
      videoIds.forEach((id: string) => {
        const like = likes.find(l => l.targetId === id);
        likeMap[id] = like ? like.type : null;
      });

      res.json({ likes: likeMap });
    } catch (error) {
      next(error);
    }
  }
);

// Get videos liked by user
router.get(
  '/user/:userId/videos',
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Like.findAndCountAll({
        where: {
          userId,
          targetType: LikeTarget.VIDEO,
          type: LikeType.LIKE
        },
        include: [
          {
            model: Video,
            as: 'video',
            required: true
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        videos: rows.map((l: any) => l.video),
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
