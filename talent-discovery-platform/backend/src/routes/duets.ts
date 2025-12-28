import { Router, RequestHandler } from 'express';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as duetController from '../controllers/duetController';

const router = Router();

// Cast middleware to RequestHandler
const auth = authenticate as RequestHandler;
const optAuth = optionalAuth as RequestHandler;

// Get trending duets
router.get('/trending', optAuth, duetController.getTrendingDuets as RequestHandler);

// Get my duets
router.get('/me', auth, duetController.getMyDuets as RequestHandler);

// Get duets for a specific video
router.get(
  '/video/:videoId',
  optAuth,
  validate([
    param('videoId').isUUID().withMessage('Valid video ID required')
  ]),
  duetController.getVideoDuets as RequestHandler
);

// Check if video allows duets
router.get(
  '/check/:videoId',
  optAuth,
  validate([
    param('videoId').isUUID().withMessage('Valid video ID required')
  ]),
  duetController.checkDuetAllowed as RequestHandler
);

// Get a specific duet
router.get(
  '/:duetId',
  optAuth,
  validate([
    param('duetId').isUUID().withMessage('Valid duet ID required')
  ]),
  duetController.getDuet as RequestHandler
);

// Create a new duet
router.post(
  '/',
  auth,
  validate([
    body('originalVideoId').isUUID().withMessage('Valid original video ID required'),
    body('responseVideoId').isUUID().withMessage('Valid response video ID required'),
    body('layout').optional().isIn(['side_by_side', 'top_bottom', 'picture_in_picture', 'green_screen']),
    body('audioMix').optional().isIn(['both', 'original', 'response']),
    body('originalVolume').optional().isInt({ min: 0, max: 100 }),
    body('responseVolume').optional().isInt({ min: 0, max: 100 }),
    body('syncOffset').optional().isInt()
  ]),
  duetController.createDuet as RequestHandler
);

// Update a duet
router.put(
  '/:duetId',
  auth,
  validate([
    param('duetId').isUUID().withMessage('Valid duet ID required'),
    body('layout').optional().isIn(['side_by_side', 'top_bottom', 'picture_in_picture', 'green_screen']),
    body('audioMix').optional().isIn(['both', 'original', 'response']),
    body('originalVolume').optional().isInt({ min: 0, max: 100 }),
    body('responseVolume').optional().isInt({ min: 0, max: 100 }),
    body('syncOffset').optional().isInt()
  ]),
  duetController.updateDuet as RequestHandler
);

// Delete a duet
router.delete(
  '/:duetId',
  auth,
  validate([
    param('duetId').isUUID().withMessage('Valid duet ID required')
  ]),
  duetController.deleteDuet as RequestHandler
);

export default router;
