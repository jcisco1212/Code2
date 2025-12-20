import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { User, Video, VideoStatus, VideoVisibility, Follow } from '../models';
import { NotFoundError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

const router = Router();

// Get user by ID or username
router.get(
  '/:identifier',
  optionalAuth as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  optionalAuth as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl', 'bio']
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl', 'bio']
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

// Search users with comprehensive filters (for agents scouting talent)
router.get(
  '/',
  validate([
    query('q').optional().isLength({ min: 1 }).withMessage('Search query required'),
    query('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
    query('minAge').optional().isInt({ min: 0, max: 120 }).withMessage('Invalid min age'),
    query('maxAge').optional().isInt({ min: 0, max: 120 }).withMessage('Invalid max age'),
    query('ethnicity').optional().isLength({ min: 1 }).withMessage('Invalid ethnicity'),
    query('location').optional().isLength({ min: 1 }).withMessage('Invalid location'),
    query('categoryId').optional().isUUID().withMessage('Invalid category ID'),
    query('artistType').optional().isIn(['solo', 'band']).withMessage('Invalid artist type'),
    query('genre').optional().isLength({ min: 1 }).withMessage('Invalid genre')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        q,
        page = 1,
        limit = 20,
        role,
        gender,
        minAge,
        maxAge,
        ethnicity,
        location,
        categoryId,
        artistType,
        genre,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {
        isActive: true
      };

      // Text search
      if (q) {
        const searchTerm = (q as string).toLowerCase();
        where[Op.or] = [
          { username: { [Op.iLike]: `%${searchTerm}%` } },
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { bio: { [Op.iLike]: `%${searchTerm}%` } }
        ];
      }

      // Role filter
      if (role) {
        where.role = role;
      } else {
        // Default to showing creators (talent) for agent searches
        where.role = { [Op.in]: ['creator', 'user'] };
      }

      // Gender filter
      if (gender) {
        where.gender = gender;
      }

      // Age filter (calculated from dateOfBirth)
      if (minAge || maxAge) {
        const today = new Date();
        if (minAge) {
          const maxBirthDate = new Date(today.getFullYear() - Number(minAge), today.getMonth(), today.getDate());
          where.dateOfBirth = { ...where.dateOfBirth, [Op.lte]: maxBirthDate };
        }
        if (maxAge) {
          const minBirthDate = new Date(today.getFullYear() - Number(maxAge) - 1, today.getMonth(), today.getDate());
          where.dateOfBirth = { ...where.dateOfBirth, [Op.gte]: minBirthDate };
        }
      }

      // Ethnicity filter
      if (ethnicity) {
        where.ethnicity = { [Op.iLike]: `%${ethnicity}%` };
      }

      // Location filter
      if (location) {
        where.location = { [Op.iLike]: `%${location}%` };
      }

      // Category filter
      if (categoryId) {
        where.talentCategories = { [Op.contains]: [categoryId] };
      }

      // Artist type filter (solo/band)
      if (artistType) {
        where.artistType = artistType;
      }

      // Genre filter
      if (genre) {
        where.genre = { [Op.iLike]: `%${genre}%` };
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: [
          'id', 'username', 'firstName', 'lastName', 'avatarUrl', 'bio',
          'role', 'location', 'gender', 'dateOfBirth', 'ethnicity',
          'artistType', 'genre', 'talentCategories', 'photoGallery', 'isVerified', 'createdAt'
        ],
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset
      });

      // Calculate age for each user
      const usersWithAge = rows.map(user => {
        const userData = user.toJSON() as any;
        if (userData.dateOfBirth) {
          const today = new Date();
          const birth = new Date(userData.dateOfBirth);
          let age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          userData.age = age;
        }
        // Don't expose dateOfBirth to other users
        delete userData.dateOfBirth;
        return userData;
      });

      res.json({
        users: usersWithAge,
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
