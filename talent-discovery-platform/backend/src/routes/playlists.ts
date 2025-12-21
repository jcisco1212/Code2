import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { Video, User } from '../models';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { DataTypes, Model } from 'sequelize';

// Define Playlist model inline (until properly integrated)
class Playlist extends Model {
  declare id: string;
  declare userId: string;
  declare title: string;
  declare description: string | null;
  declare visibility: string;
  declare thumbnailUrl: string | null;
  declare videoCount: number;
}

Playlist.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  visibility: { type: DataTypes.STRING(20), defaultValue: 'public' },
  thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'thumbnail_url' },
  videoCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'video_count' }
}, { sequelize, tableName: 'playlists', modelName: 'Playlist' });

class PlaylistVideo extends Model {
  declare id: string;
  declare playlistId: string;
  declare videoId: string;
  declare position: number;
}

PlaylistVideo.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  playlistId: { type: DataTypes.UUID, allowNull: false, field: 'playlist_id' },
  videoId: { type: DataTypes.UUID, allowNull: false, field: 'video_id' },
  position: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { sequelize, tableName: 'playlist_videos', modelName: 'PlaylistVideo', timestamps: false });

// Associations
Playlist.hasMany(PlaylistVideo, { foreignKey: 'playlistId', as: 'videos' });
PlaylistVideo.belongsTo(Playlist, { foreignKey: 'playlistId' });
PlaylistVideo.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });

const router = Router();

// Get user's playlists
router.get(
  '/',
  authenticate as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const playlists = await Playlist.findAll({
        where: { userId: req.userId },
        order: [['createdAt', 'DESC']]
      });

      res.json({ playlists });
    } catch (error) {
      next(error);
    }
  }
);

// Get public playlists for a user
router.get(
  '/user/:userId',
  optionalAuth as RequestHandler,
  validate([param('userId').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const where: any = { userId: req.params.userId };

      // Only show public playlists unless it's the owner
      if (req.userId !== req.params.userId) {
        where.visibility = 'public';
      }

      const playlists = await Playlist.findAll({
        where,
        order: [['createdAt', 'DESC']]
      });

      res.json({ playlists });
    } catch (error) {
      next(error);
    }
  }
);

// Create playlist
router.post(
  '/',
  authenticate as RequestHandler,
  validate([
    body('title').notEmpty().isLength({ max: 255 }),
    body('description').optional().isLength({ max: 5000 }),
    body('visibility').optional().isIn(['public', 'unlisted', 'private'])
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, description, visibility = 'public' } = req.body;

      const playlist = await Playlist.create({
        userId: req.userId!,
        title,
        description,
        visibility
      });

      res.status(201).json({ playlist });
    } catch (error) {
      next(error);
    }
  }
);

// Get single playlist with videos
router.get(
  '/:id',
  optionalAuth as RequestHandler,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const playlist = await Playlist.findByPk(req.params.id, {
        include: [{
          model: PlaylistVideo,
          as: 'videos',
          include: [{
            model: Video,
            as: 'video',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
            }]
          }],
          order: [['position', 'ASC']]
        }]
      });

      if (!playlist) {
        throw new NotFoundError('Playlist not found');
      }

      // Check visibility
      if (playlist.visibility === 'private' && playlist.userId !== req.userId) {
        throw new ForbiddenError('This playlist is private');
      }

      res.json({ playlist });
    } catch (error) {
      next(error);
    }
  }
);

// Update playlist
router.put(
  '/:id',
  authenticate as RequestHandler,
  validate([
    param('id').isUUID(),
    body('title').optional().isLength({ max: 255 }),
    body('description').optional().isLength({ max: 5000 }),
    body('visibility').optional().isIn(['public', 'unlisted', 'private'])
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const playlist = await Playlist.findByPk(req.params.id);

      if (!playlist) {
        throw new NotFoundError('Playlist not found');
      }

      if (playlist.userId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      const { title, description, visibility } = req.body;
      await playlist.update({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(visibility && { visibility })
      });

      res.json({ playlist });
    } catch (error) {
      next(error);
    }
  }
);

// Delete playlist
router.delete(
  '/:id',
  authenticate as RequestHandler,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const playlist = await Playlist.findByPk(req.params.id);

      if (!playlist) {
        throw new NotFoundError('Playlist not found');
      }

      if (playlist.userId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      await PlaylistVideo.destroy({ where: { playlistId: playlist.id } });
      await playlist.destroy();

      res.json({ message: 'Playlist deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// Add video to playlist
router.post(
  '/:id/videos',
  authenticate as RequestHandler,
  validate([
    param('id').isUUID(),
    body('videoId').isUUID()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const playlist = await Playlist.findByPk(req.params.id);

      if (!playlist) {
        throw new NotFoundError('Playlist not found');
      }

      if (playlist.userId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      const video = await Video.findByPk(req.body.videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }

      // Check if already in playlist
      const existing = await PlaylistVideo.findOne({
        where: { playlistId: playlist.id, videoId: video.id }
      });

      if (existing) {
        res.json({ message: 'Video already in playlist' });
        return;
      }

      // Get next position
      const maxPosition = await PlaylistVideo.max('position', {
        where: { playlistId: playlist.id }
      }) as number || 0;

      await PlaylistVideo.create({
        playlistId: playlist.id,
        videoId: video.id,
        position: maxPosition + 1
      });

      await playlist.update({ videoCount: playlist.videoCount + 1 });

      res.json({ message: 'Video added to playlist' });
    } catch (error) {
      next(error);
    }
  }
);

// Remove video from playlist
router.delete(
  '/:id/videos/:videoId',
  authenticate as RequestHandler,
  validate([
    param('id').isUUID(),
    param('videoId').isUUID()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const playlist = await Playlist.findByPk(req.params.id);

      if (!playlist) {
        throw new NotFoundError('Playlist not found');
      }

      if (playlist.userId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      const deleted = await PlaylistVideo.destroy({
        where: { playlistId: playlist.id, videoId: req.params.videoId }
      });

      if (deleted) {
        await playlist.update({ videoCount: Math.max(0, playlist.videoCount - 1) });
      }

      res.json({ message: 'Video removed from playlist' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
