import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { SavedVideo, Video, User, Category } from '../models';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

// Get user's saved videos
router.get(
  '/',
  authenticate as RequestHandler,
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await SavedVideo.findAndCountAll({
        where: { userId: req.userId },
        include: [
          {
            model: Video,
            as: 'video',
            include: [
              { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
              { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        savedVideos: rows.map(sv => ({
          id: sv.id,
          savedAt: sv.createdAt,
          video: (sv as any).video
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

// Save a video
router.post(
  '/:videoId',
  authenticate as RequestHandler,
  validate([
    param('videoId').isUUID().withMessage('Valid video ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.params;

      // Check video exists
      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }

      // Check if already saved
      const existing = await SavedVideo.findOne({
        where: { userId: req.userId, videoId }
      });

      if (existing) {
        res.json({ saved: true, message: 'Video already saved' });
        return;
      }

      await SavedVideo.create({
        userId: req.userId!,
        videoId
      });

      res.status(201).json({ saved: true, message: 'Video saved' });
    } catch (error) {
      next(error);
    }
  }
);

// Unsave a video
router.delete(
  '/:videoId',
  authenticate as RequestHandler,
  validate([
    param('videoId').isUUID().withMessage('Valid video ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.params;

      const deleted = await SavedVideo.destroy({
        where: { userId: req.userId, videoId }
      });

      if (deleted === 0) {
        res.json({ saved: false, message: 'Video was not saved' });
        return;
      }

      res.json({ saved: false, message: 'Video unsaved' });
    } catch (error) {
      next(error);
    }
  }
);

// Check if video is saved
router.get(
  '/check/:videoId',
  authenticate as RequestHandler,
  validate([
    param('videoId').isUUID().withMessage('Valid video ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.params;

      const saved = await SavedVideo.findOne({
        where: { userId: req.userId, videoId }
      });

      res.json({ saved: !!saved });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
