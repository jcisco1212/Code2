import { Router, RequestHandler } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as challengeController from '../controllers/challengeController';

const router = Router();

// Cast middleware to RequestHandler
const auth = authenticate as RequestHandler;
const optAuth = optionalAuth as RequestHandler;

// Get all challenges (with filters)
router.get('/', optAuth, challengeController.getChallenges as RequestHandler);

// Get active challenges
router.get('/active', optAuth, challengeController.getActiveChallenges as RequestHandler);

// Get featured/trending challenges
router.get('/featured', optAuth, challengeController.getFeaturedChallenges as RequestHandler);

// Get single challenge
router.get(
  '/:id',
  optAuth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required')
  ]),
  challengeController.getChallenge as RequestHandler
);

// Get challenge entries
router.get(
  '/:id/entries',
  optAuth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required')
  ]),
  challengeController.getChallengeEntries as RequestHandler
);

// Get challenge leaderboard
router.get(
  '/:id/leaderboard',
  optAuth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required')
  ]),
  challengeController.getChallengeLeaderboard as RequestHandler
);

// Create challenge (admin only)
router.post(
  '/',
  auth,
  validate([
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required (1-200 chars)'),
    body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description required (10-5000 chars)'),
    body('hashtag').trim().isLength({ min: 2, max: 50 }).withMessage('Hashtag required (2-50 chars)'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('rules').optional().trim().isLength({ max: 5000 }).withMessage('Rules too long'),
    body('categoryId').optional({ nullable: true }).isUUID().withMessage('Valid category ID required'),
    body('prize').optional().trim().isLength({ max: 500 }).withMessage('Prize description too long'),
    body('prizeAmount').optional().isFloat({ min: 0 }).withMessage('Prize amount must be positive'),
    body('votingEndDate').optional().isISO8601().withMessage('Valid voting end date required'),
    body('minDuration').optional().isInt({ min: 1 }).withMessage('Min duration must be positive'),
    body('maxDuration').optional().isInt({ min: 1 }).withMessage('Max duration must be positive'),
    body('maxEntries').optional().isInt({ min: 1 }).withMessage('Max entries must be positive')
  ]),
  challengeController.createChallenge as RequestHandler
);

// Update challenge (admin only)
router.put(
  '/:id',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 chars'),
    body('description').optional().trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 chars'),
    body('rules').optional().trim().isLength({ max: 5000 }).withMessage('Rules too long'),
    body('status').optional().isIn(['draft', 'active', 'voting', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('prize').optional().trim().isLength({ max: 500 }).withMessage('Prize description too long'),
    body('prizeAmount').optional().isFloat({ min: 0 }).withMessage('Prize amount must be positive')
  ]),
  challengeController.updateChallenge as RequestHandler
);

// Delete challenge (admin only)
router.delete(
  '/:id',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required')
  ]),
  challengeController.deleteChallenge as RequestHandler
);

// Submit entry to challenge
router.post(
  '/:id/entries',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required'),
    body('videoId').isUUID().withMessage('Valid video ID required')
  ]),
  challengeController.submitEntry as RequestHandler
);

// Remove entry from challenge
router.delete(
  '/:id/entries/:entryId',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required'),
    param('entryId').isUUID().withMessage('Valid entry ID required')
  ]),
  challengeController.removeEntry as RequestHandler
);

// Vote for an entry
router.post(
  '/:id/vote',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required'),
    body('entryId').isUUID().withMessage('Valid entry ID required')
  ]),
  challengeController.voteForEntry as RequestHandler
);

// Get user's vote
router.get(
  '/:id/my-vote',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required')
  ]),
  challengeController.getUserVote as RequestHandler
);

// Check if user has entered
router.get(
  '/:id/my-entry',
  auth,
  validate([
    param('id').isUUID().withMessage('Valid challenge ID required')
  ]),
  challengeController.getUserEntry as RequestHandler
);

export default router;
