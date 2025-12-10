import { Router } from 'express';
import { param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { User, Video, VideoStatus, VideoVisibility, Follow } from '../models';
import { NotFoundError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

const router = Router();

// Get user by ID or username
router.get(
  '/:identifier',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { identifier } = req.params;

      let user;
      // Check if identifier is UUID or username
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      if (isUUID) {
        user = await User.findByPk(identifier);
      } else {
        user = await User.findOne({ where: { username: identifier } });
      }

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get follower/following counts
      const followersCount = await Follow.count({ where: { followingId: user.id } });
      const followingCount = await Follow.count({ where: { followerId: user.id } });

      // Check if current user follows this user
      let isFollowing = false;
      if (req.userId && req.userId !== user.id) {
        const follow = await Follow.findOne({
          where: { followerId: req.userId, followingId: user.id }
        });
        isFollowing = !!follow;
      }

      // Get video count
      const videoCount = await Video.count({
        where: {
          userId: user.id,
          status: VideoStatus.READY,
          visibility: VideoVisibility.PUBLIC
        }
      });

      res.json({
        user: {
          ...user.toPublicJSON(),
          followersCount,
          followingCount,
          videoCount,
          isFollowing
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's videos
router.get(
  '/:userId/videos',
  optionalAuth,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, sortBy = 'createdAt', order = 'DESC' } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Check if viewing own videos
      const isOwner = req.userId === userId;

      const where: any = {
        userId,
        status: VideoStatus.READY
      };

      if (!isOwner) {
        where.visibility = VideoVisibility.PUBLIC;
      }

      const { count, rows } = await Video.findAndCountAll({
        where,
        order: [[sortBy as string, order as string]],
        limit: Number(limit),
        offset
      });

      res.json({
        videos: rows.map(v => v.toPublicJSON()),
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

// Get user's followers
router.get(
  '/:userId/followers',
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Follow.findAndCountAll({
        where: { followingId: userId },
        include: [
          {
            model: User,
            as: 'follower',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl', 'bio']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        followers: rows.map((f: any) => f.follower),
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

// Get user's following
router.get(
  '/:userId/following',
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Follow.findAndCountAll({
        where: { followerId: userId },
        include: [
          {
            model: User,
            as: 'following',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl', 'bio']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        following: rows.map((f: any) => f.following),
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

// Search users
router.get(
  '/',
  validate([
    query('q').optional().isLength({ min: 1 }).withMessage('Search query required')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, page = 1, limit = 20, role } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (q) {
        const searchTerm = (q as string).toLowerCase();
        where[Op.or] = [
          { username: { [Op.iLike]: `%${searchTerm}%` } },
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } }
        ];
      }

      if (role) {
        where.role = role;
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl', 'bio', 'role', 'talentCategories'],
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

export default router;
