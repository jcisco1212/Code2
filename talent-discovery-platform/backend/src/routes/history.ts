import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { Video, User, SavedVideo } from '../models';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

const router = Router();

// ========================
// Watch History (simulated using VideoView)
// ========================

// Get user's watch history
router.get(
  '/',
  authenticate as RequestHandler,
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // For now, use VideoView as watch history
      const { VideoView } = await import('../models');

      const { count, rows: history } = await VideoView.findAndCountAll({
        where: { userId: req.userId },
        include: [{
          model: Video,
          as: 'video',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
          }]
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        history: history.map(h => ({
          id: h.id,
          watchedAt: h.createdAt,
          video: h.video
        })),
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Clear watch history
router.delete(
  '/',
  authenticate as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { VideoView } = await import('../models');
      await VideoView.destroy({ where: { userId: req.userId } });
      res.json({ message: 'Watch history cleared' });
    } catch (error) {
      next(error);
    }
  }
);

// Remove single item from history
router.delete(
  '/:videoId',
  authenticate as RequestHandler,
  validate([
    param('videoId').isUUID()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { VideoView } = await import('../models');
      await VideoView.destroy({
        where: {
          userId: req.userId,
          videoId: req.params.videoId
        }
      });
      res.json({ message: 'Removed from history' });
    } catch (error) {
      next(error);
    }
  }
);

// ========================
// Watch Later / Saved Videos
// ========================

// Get saved videos
router.get(
  '/saved',
  authenticate as RequestHandler,
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const { count, rows: saved } = await SavedVideo.findAndCountAll({
        where: { userId: req.userId },
        include: [{
          model: Video,
          as: 'video',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
          }]
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        videos: saved.map(s => ({
          savedAt: s.createdAt,
          ...s.video?.toJSON()
        })),
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Save video for later
router.post(
  '/saved/:videoId',
  authenticate as RequestHandler,
  validate([
    param('videoId').isUUID()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.params;

      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }

      const [saved, created] = await SavedVideo.findOrCreate({
        where: { userId: req.userId!, videoId },
        defaults: { userId: req.userId!, videoId }
      });

      res.json({
        saved: true,
        message: created ? 'Video saved' : 'Already saved'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Remove from saved
router.delete(
  '/saved/:videoId',
  authenticate as RequestHandler,
  validate([
    param('videoId').isUUID()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await SavedVideo.destroy({
        where: {
          userId: req.userId,
          videoId: req.params.videoId
        }
      });
      res.json({ saved: false, message: 'Removed from saved' });
    } catch (error) {
      next(error);
    }
  }
);

// Check if video is saved
router.get(
  '/saved/:videoId/check',
  authenticate as RequestHandler,
  validate([
    param('videoId').isUUID()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const saved = await SavedVideo.findOne({
        where: {
          userId: req.userId,
          videoId: req.params.videoId
        }
      });
      res.json({ saved: !!saved });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
