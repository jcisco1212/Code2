import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { Comment, CommentStatus, Video, User, Like, LikeTarget } from '../models';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler';
import { aiQueue } from '../jobs/videoQueue';

const router = Router();

// Get comments for a video
router.get(
  '/video/:videoId',
  optionalAuth as RequestHandler,
  validate([
    param('videoId').isUUID().withMessage('Valid video ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.params;
      const { page = 1, limit = 20, sortBy = 'createdAt', order = 'DESC' } = req.query;

      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }

      if (!video.commentsEnabled && video.userId !== req.userId) {
        res.json({ comments: [], message: 'Comments are disabled' });
        return;
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Comment.findAndCountAll({
        where: {
          videoId,
          parentId: null, // Top-level comments only
          status: CommentStatus.ACTIVE
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl']
          }
        ],
        order: sortBy === 'likes'
          ? [['likes', 'DESC'], ['createdAt', 'DESC']]
          : [[sortBy as string, order as string]],
        limit: Number(limit),
        offset
      });

      res.json({
        comments: rows,
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

// Get replies to a comment
router.get(
  '/:commentId/replies',
  optionalAuth as RequestHandler,
  validate([
    param('commentId').isUUID().withMessage('Valid comment ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { commentId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await Comment.findAndCountAll({
        where: {
          parentId: commentId,
          status: CommentStatus.ACTIVE
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl']
          }
        ],
        order: [['createdAt', 'ASC']],
        limit: Number(limit),
        offset
      });

      res.json({
        replies: rows,
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

// Create comment
router.post(
  '/',
  authenticate as RequestHandler,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required'),
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Comment must be 1-10000 chars'),
    body('parentId').optional().isUUID().withMessage('Valid parent comment ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId, content, parentId } = req.body;

      // Check video exists and comments are enabled
      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }

      if (!video.commentsEnabled) {
        throw new BadRequestError('Comments are disabled for this video');
      }

      // If reply, check parent exists
      if (parentId) {
        const parent = await Comment.findByPk(parentId);
        if (!parent || parent.videoId !== videoId) {
          throw new BadRequestError('Invalid parent comment');
        }
      }

      const comment = await Comment.create({
        videoId,
        userId: req.userId!,
        content,
        parentId: parentId || null
      });

      // Update comment count on video
      await video.increment('commentCount');

      // Update reply count on parent
      if (parentId) {
        await Comment.increment('replyCount', { where: { id: parentId } });
      }

      // Queue sentiment analysis
      await aiQueue.add('commentAnalysis', { commentId: comment.id }, { priority: 3 });

      // Fetch with user
      const commentWithUser = await Comment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl']
          }
        ]
      });

      res.status(201).json({ comment: commentWithUser });
    } catch (error) {
      next(error);
    }
  }
);

// Update comment
router.put(
  '/:id',
  authenticate as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid comment ID required'),
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Comment must be 1-10000 chars')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      const comment = await Comment.findByPk(id);
      if (!comment) {
        throw new NotFoundError('Comment not found');
      }

      if (comment.userId !== req.userId) {
        throw new ForbiddenError('Not authorized to edit this comment');
      }

      await comment.update({
        content,
        editedAt: new Date()
      });

      // Re-queue sentiment analysis
      await aiQueue.add('commentAnalysis', { commentId: comment.id }, { priority: 3 });

      res.json({ comment });
    } catch (error) {
      next(error);
    }
  }
);

// Delete comment
router.delete(
  '/:id',
  authenticate as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid comment ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const comment = await Comment.findByPk(id, {
        include: [{ model: Video, as: 'video' }]
      });

      if (!comment) {
        throw new NotFoundError('Comment not found');
      }

      // Allow delete if owner of comment or video owner
      if (comment.userId !== req.userId && (comment as any).video.userId !== req.userId) {
        throw new ForbiddenError('Not authorized to delete this comment');
      }

      await comment.update({ status: CommentStatus.DELETED });

      // Update comment count
      await Video.decrement('commentCount', { where: { id: comment.videoId } });

      // Update parent reply count
      if (comment.parentId) {
        await Comment.decrement('replyCount', { where: { id: comment.parentId } });
      }

      res.json({ message: 'Comment deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// Pin/unpin comment (video owner only)
router.post(
  '/:id/pin',
  authenticate as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid comment ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const comment = await Comment.findByPk(id, {
        include: [{ model: Video, as: 'video' }]
      });

      if (!comment) {
        throw new NotFoundError('Comment not found');
      }

      if ((comment as any).video.userId !== req.userId) {
        throw new ForbiddenError('Only video owner can pin comments');
      }

      // Unpin other comments first
      if (!comment.isPinned) {
        await Comment.update(
          { isPinned: false },
          { where: { videoId: comment.videoId, isPinned: true } }
        );
      }

      await comment.update({ isPinned: !comment.isPinned });

      res.json({ isPinned: comment.isPinned });
    } catch (error) {
      next(error);
    }
  }
);

// Highlight comment (video owner only)
router.post(
  '/:id/highlight',
  authenticate as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid comment ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const comment = await Comment.findByPk(id, {
        include: [{ model: Video, as: 'video' }]
      });

      if (!comment) {
        throw new NotFoundError('Comment not found');
      }

      if ((comment as any).video.userId !== req.userId) {
        throw new ForbiddenError('Only video owner can highlight comments');
      }

      await comment.update({ isCreatorHighlighted: !comment.isCreatorHighlighted });

      res.json({ isCreatorHighlighted: comment.isCreatorHighlighted });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
