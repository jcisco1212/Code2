import { Router, RequestHandler } from 'express';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as achievementController from '../controllers/achievementController';

const router = Router();

// Cast middleware to RequestHandler
const auth = authenticate as RequestHandler;
const optAuth = optionalAuth as RequestHandler;

// Get all achievements
router.get('/', optAuth, achievementController.getAchievements as RequestHandler);

// Get current user's achievements
router.get('/me', auth, achievementController.getMyAchievements as RequestHandler);

// Get user's displayed achievements (for profile)
router.get(
  '/user/:userId/displayed',
  optAuth,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  achievementController.getDisplayedAchievements as RequestHandler
);

// Get user's achievements
router.get(
  '/user/:userId',
  optAuth,
  validate([
    param('userId').isUUID().withMessage('Valid user ID required')
  ]),
  achievementController.getUserAchievements as RequestHandler
);

// Toggle achievement display on profile
router.put(
  '/:achievementId/display',
  auth,
  validate([
    param('achievementId').isUUID().withMessage('Valid achievement ID required'),
    body('isDisplayed').isBoolean().withMessage('isDisplayed must be boolean')
  ]),
  achievementController.toggleAchievementDisplay as RequestHandler
);

// Seed default achievements (admin only)
router.post('/seed', auth, achievementController.seedAchievements as RequestHandler);

export default router;
