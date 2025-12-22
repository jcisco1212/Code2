import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { User } from '../models';
import UserBlock, { initUserBlock } from '../models/UserBlock';
import { sequelize } from '../config/database';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

// Initialize UserBlock model
initUserBlock(sequelize);

const router = Router();

// Block a user
router.post(
  '/block/:userId',
  authenticate as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required'),
    body('reason').optional().isLength({ max: 500 }).withMessage('Reason max 500 chars')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (userId === req.userId) {
        throw new BadRequestError('Cannot block yourself');
      }

      const userToBlock = await User.findByPk(userId);
      if (!userToBlock) {
        throw new NotFoundError('User not found');
      }

      // Check if already blocked
      const existing = await UserBlock.findOne({
        where: {
          blockerId: req.userId,
          blockedId: userId,
          type: 'block'
        }
      });

      if (existing) {
        res.json({ blocked: true, message: 'Already blocked' });
        return;
      }

      await UserBlock.create({
        blockerId: req.userId!,
        blockedId: userId,
        type: 'block',
        reason: reason || null
      });

      res.json({ blocked: true });
    } catch (error) {
      next(error);
    }
  }
);

// Unblock a user
router.delete(
  '/block/:userId',
  authenticate as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      const block = await UserBlock.findOne({
        where: {
          blockerId: req.userId,
          blockedId: userId,
          type: 'block'
        }
      });

      if (!block) {
        res.json({ blocked: false, message: 'Not blocked' });
        return;
      }

      await block.destroy();

      res.json({ blocked: false });
    } catch (error) {
      next(error);
    }
  }
);

// Mute a user (hide their content without blocking)
router.post(
  '/mute/:userId',
  authenticate as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required'),
    body('reason').optional().isLength({ max: 500 }).withMessage('Reason max 500 chars')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (userId === req.userId) {
        throw new BadRequestError('Cannot mute yourself');
      }

      const userToMute = await User.findByPk(userId);
      if (!userToMute) {
        throw new NotFoundError('User not found');
      }

      // Check if already muted
      const existing = await UserBlock.findOne({
        where: {
          blockerId: req.userId,
          blockedId: userId,
          type: 'mute'
        }
      });

      if (existing) {
        res.json({ muted: true, message: 'Already muted' });
        return;
      }

      await UserBlock.create({
        blockerId: req.userId!,
        blockedId: userId,
        type: 'mute',
        reason: reason || null
      });

      res.json({ muted: true });
    } catch (error) {
      next(error);
    }
  }
);

// Unmute a user
router.delete(
  '/mute/:userId',
  authenticate as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      const mute = await UserBlock.findOne({
        where: {
          blockerId: req.userId,
          blockedId: userId,
          type: 'mute'
        }
      });

      if (!mute) {
        res.json({ muted: false, message: 'Not muted' });
        return;
      }

      await mute.destroy();

      res.json({ muted: false });
    } catch (error) {
      next(error);
    }
  }
);

// Check block/mute status
router.get(
  '/status/:userId',
  authenticate as RequestHandler,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      const blocks = await UserBlock.findAll({
        where: {
          blockerId: req.userId,
          blockedId: userId
        }
      });

      const blocked = blocks.some(b => b.type === 'block');
      const muted = blocks.some(b => b.type === 'mute');

      // Also check if the other user has blocked current user
      const blockedBy = await UserBlock.findOne({
        where: {
          blockerId: userId,
          blockedId: req.userId,
          type: 'block'
        }
      });

      res.json({
        blocked,
        muted,
        blockedByUser: !!blockedBy
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get list of blocked users
router.get(
  '/blocked',
  authenticate as RequestHandler,
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const { count, rows } = await UserBlock.findAndCountAll({
        where: {
          blockerId: req.userId,
          type: 'block'
        },
        include: [{
          model: User,
          as: 'blocked',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        }],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        blocked: rows.map(b => ({
          id: b.id,
          user: (b as any).blocked,
          reason: b.reason,
          createdAt: b.createdAt
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

// Get list of muted users
router.get(
  '/muted',
  authenticate as RequestHandler,
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const { count, rows } = await UserBlock.findAndCountAll({
        where: {
          blockerId: req.userId,
          type: 'mute'
        },
        include: [{
          model: User,
          as: 'blocked',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        }],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        muted: rows.map(m => ({
          id: m.id,
          user: (m as any).blocked,
          reason: m.reason,
          createdAt: m.createdAt
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

// Get IDs of blocked and muted users (for filtering)
router.get(
  '/ids',
  authenticate as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const blocks = await UserBlock.findAll({
        where: {
          blockerId: req.userId
        },
        attributes: ['blockedId', 'type']
      });

      const blockedIds = blocks.filter(b => b.type === 'block').map(b => b.blockedId);
      const mutedIds = blocks.filter(b => b.type === 'mute').map(b => b.blockedId);

      // Also get users who have blocked the current user
      const blockedByOthers = await UserBlock.findAll({
        where: {
          blockedId: req.userId,
          type: 'block'
        },
        attributes: ['blockerId']
      });

      const blockedByIds = blockedByOthers.map(b => b.blockerId);

      res.json({
        blockedIds,
        mutedIds,
        blockedByIds
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
