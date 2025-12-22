import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { Follow, User, Notification, NotificationType } from '../models';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const router = Router();

// Follow a user
router.post(
  '/:userId',
  authenticate as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      if (userId === req.userId) {
        throw new BadRequestError('Cannot follow yourself');
      }

      const userToFollow = await User.findByPk(userId);
      if (!userToFollow) {
        throw new NotFoundError('User not found');
      }

      // Check if already following
      const existingFollow = await Follow.findOne({
        where: {
          followerId: req.userId,
          followingId: userId
        }
      });

      if (existingFollow) {
        res.json({ following: true, message: 'Already following' });
        return;
      }

      await Follow.create({
        followerId: req.userId!,
        followingId: userId
      });

      // Create notification (don't let notification failure break the follow)
      try {
        const followerUser = (req as any).user;
        const followerUsername = followerUser?.username || 'Someone';
        await Notification.create({
          userId,
          type: NotificationType.NEW_FOLLOWER,
          title: 'New Follower',
          message: `${followerUsername} started following you`,
          data: { followerId: req.userId }
        });
      } catch (notifError) {
        // Log but don't fail the follow operation
        console.error('Failed to create follow notification:', notifError);
      }

      res.json({ following: true });
    } catch (error) {
      next(error);
    }
  }
);

// Unfollow a user
router.delete(
  '/:userId',
  authenticate as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      const follow = await Follow.findOne({
        where: {
          followerId: req.userId,
          followingId: userId
        }
      });

      if (!follow) {
        res.json({ following: false, message: 'Not following' });
        return;
      }

      await follow.destroy();

      res.json({ following: false });
    } catch (error) {
      next(error);
    }
  }
);

// Check if following
router.get(
  '/check/:userId',
  authenticate as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      const follow = await Follow.findOne({
        where: {
          followerId: req.userId,
          followingId: userId
        }
      });

      res.json({ following: !!follow });
    } catch (error) {
      next(error);
    }
  }
);

// Check follow status for multiple users
router.post(
  '/check-multiple',
  authenticate as RequestHandler,
  validate([
    body('userIds').isArray({ min: 1, max: 100 }).withMessage('User IDs array required (1-100 items)')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userIds } = req.body;

      const follows = await Follow.findAll({
        where: {
          followerId: req.userId,
          followingId: userIds
        }
      });

      const followMap: Record<string, boolean> = {};
      userIds.forEach((id: string) => {
        followMap[id] = follows.some(f => f.followingId === id);
      });

      res.json({ following: followMap });
    } catch (error) {
      next(error);
    }
  }
);

// Get mutual followers
router.get(
  '/mutual/:userId',
  authenticate as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Get users that both current user and target user follow
      const myFollowing = await Follow.findAll({
        where: { followerId: req.userId },
        attributes: ['followingId']
      });

      const theirFollowing = await Follow.findAll({
        where: { followerId: userId },
        attributes: ['followingId']
      });

      const myFollowingIds = myFollowing.map(f => f.followingId);
      const theirFollowingIds = theirFollowing.map(f => f.followingId);

      const mutualIds = myFollowingIds.filter(id => theirFollowingIds.includes(id));

      const offset = (Number(page) - 1) * Number(limit);
      const paginatedIds = mutualIds.slice(offset, offset + Number(limit));

      const users = await User.findAll({
        where: { id: paginatedIds },
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
      });

      res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: mutualIds.length,
          pages: Math.ceil(mutualIds.length / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
