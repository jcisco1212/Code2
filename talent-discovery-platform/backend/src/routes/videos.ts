import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import * as videoController from '../controllers/videoController';

const router = Router();

// Get trending videos
router.get('/trending', optionalAuth, videoController.getTrendingVideos);

// Get featured videos
router.get('/featured', optionalAuth, videoController.getFeaturedVideos);

// Get videos by category
router.get(
  '/category/:categoryId',
  optionalAuth,
  validate([
    param('categoryId').isUUID().withMessage('Valid category ID required')
  ]),
  videoController.getVideosByCategory
);

// Search videos
router.get(
  '/search',
  optionalAuth,
  validate([
    query('q').notEmpty().withMessage('Search query required')
  ]),
  videoController.searchVideos
);

// Get all videos (with filters)
router.get('/', optionalAuth, videoController.getVideos);

// Get single video
router.get(
  '/:id',
  optionalAuth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.getVideo
);

// Get video streaming URL
router.get(
  '/:id/stream',
  optionalAuth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.getStreamUrl
);

// Create video (metadata only - actual upload via presigned URL)
router.post(
  '/',
  authenticate,
  validate([
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title required (1-255 chars)'),
    body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description too long'),
    body('categoryId').optional().isUUID().withMessage('Valid category ID required'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('visibility').optional().isIn(['public', 'unlisted', 'private']).withMessage('Invalid visibility'),
    body('commentsEnabled').optional().isBoolean().withMessage('commentsEnabled must be boolean')
  ]),
  videoController.createVideo
);

// Update video
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid video ID required'),
    body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 chars'),
    body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description too long'),
    body('categoryId').optional().isUUID().withMessage('Valid category ID required'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('visibility').optional().isIn(['public', 'unlisted', 'private']).withMessage('Invalid visibility'),
    body('commentsEnabled').optional().isBoolean().withMessage('commentsEnabled must be boolean')
  ]),
  videoController.updateVideo
);

// Delete video
router.delete(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.deleteVideo
);

// Record view
router.post(
  '/:id/view',
  optionalAuth,
  validate([
    param('id').isUUID().withMessage('Valid video ID required'),
    body('watchTime').optional().isInt({ min: 0 }).withMessage('Watch time must be positive integer'),
    body('sessionId').notEmpty().withMessage('Session ID required')
  ]),
  videoController.recordView
);

// Get video analytics (owner only)
router.get(
  '/:id/analytics',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.getVideoAnalytics
);

// Get AI analysis results
router.get(
  '/:id/ai-analysis',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.getAIAnalysis
);

// Request AI re-analysis
router.post(
  '/:id/reanalyze',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid video ID required')
  ]),
  videoController.requestReanalysis
);

export default router;
