import { Router, RequestHandler } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as videoController from '../controllers/videoController';

const router = Router();

// Cast middleware to RequestHandler
const auth = authenticate as RequestHandler;
const optAuth = optionalAuth as RequestHandler;

// Get trending videos
router.get('/trending', optAuth, videoController.getTrendingVideos as RequestHandler);

// Get featured videos
router.get('/featured', optAuth, videoController.getFeaturedVideos as RequestHandler);

// Get videos by category
router.get(
  '/category/:categoryId',
  optAuth,
  validate([
    param('categoryId').isUUID().withMessage('Valid category ID required')
  ]),
  videoController.getVideosByCategory as RequestHandler
);

// Search videos
router.get(
  '/search',
  optAuth,
  validate([
    query('q').notEmpty().withMessage('Search query required')
  ]),
  videoController.searchVideos as RequestHandler
);

// Get all videos (with filters)
router.get('/', optAuth, videoController.getVideos as RequestHandler);

// Get single video
router.get(
  '/:id',
  optAuth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.getVideo as RequestHandler
);

// Get video streaming URL
router.get(
  '/:id/stream',
  optAuth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.getStreamUrl as RequestHandler
);

// Create video (metadata only - actual upload via presigned URL)
router.post(
  '/',
  auth,
  validate([
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title required (1-255 chars)'),
    body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description too long'),
    body('categoryId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Valid category ID required'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('visibility').optional().isIn(['public', 'unlisted', 'private']).withMessage('Invalid visibility'),
    body('commentsEnabled').optional().isBoolean().withMessage('commentsEnabled must be boolean'),
    body('isClip').optional().isBoolean().withMessage('isClip must be boolean')
  ]),
  videoController.createVideo as RequestHandler
);

// Update video
router.put(
  '/:id',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required'),
    body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 chars'),
    body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description too long'),
    body('categoryId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Valid category ID required'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('visibility').optional().isIn(['public', 'unlisted', 'private']).withMessage('Invalid visibility'),
    body('commentsEnabled').optional().isBoolean().withMessage('commentsEnabled must be boolean'),
    body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
    body('isClip').optional().isBoolean().withMessage('isClip must be boolean')
  ]),
  videoController.updateVideo as RequestHandler
);

// Delete video
router.delete(
  '/:id',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.deleteVideo as RequestHandler
);

// Record view
router.post(
  '/:id/view',
  optAuth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required'),
    body('watchTime').optional().isInt({ min: 0 }).withMessage('Watch time must be positive integer'),
    body('sessionId').notEmpty().withMessage('Session ID required')
  ]),
  videoController.recordView as RequestHandler
);

// Get video analytics (owner only)
router.get(
  '/:id/analytics',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.getVideoAnalytics as RequestHandler
);

// Get AI analysis results
router.get(
  '/:id/ai-analysis',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.getAIAnalysis as RequestHandler
);

// Request AI re-analysis
router.post(
  '/:id/reanalyze',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.requestReanalysis as RequestHandler
);

export default router;
