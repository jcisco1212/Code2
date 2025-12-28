import { Router, RequestHandler } from 'express';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as watchPartyController from '../controllers/watchPartyController';

const router = Router();

// Cast middleware to RequestHandler
const auth = authenticate as RequestHandler;
const optAuth = optionalAuth as RequestHandler;

// Get active public watch parties
router.get('/active', optAuth, watchPartyController.getActiveParties as RequestHandler);

// Get my watch parties
router.get('/me', auth, watchPartyController.getMyParties as RequestHandler);

// Get party by invite code
router.get(
  '/invite/:inviteCode',
  optAuth,
  validate([
    param('inviteCode').isLength({ min: 4, max: 20 }).withMessage('Valid invite code required')
  ]),
  watchPartyController.getPartyByInvite as RequestHandler
);

// Get a specific party
router.get(
  '/:partyId',
  optAuth,
  validate([
    param('partyId').isUUID().withMessage('Valid party ID required')
  ]),
  watchPartyController.getParty as RequestHandler
);

// Create a watch party
router.post(
  '/',
  auth,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required'),
    body('title').isLength({ min: 1, max: 200 }).withMessage('Title required (max 200 chars)'),
    body('description').optional().isLength({ max: 1000 }),
    body('isPrivate').optional().isBoolean(),
    body('maxParticipants').optional().isInt({ min: 2, max: 100 }),
    body('scheduledAt').optional().isISO8601()
  ]),
  watchPartyController.createParty as RequestHandler
);

// Join a watch party
router.post(
  '/:partyId/join',
  auth,
  validate([
    param('partyId').isUUID().withMessage('Valid party ID required')
  ]),
  watchPartyController.joinParty as RequestHandler
);

// Leave a watch party
router.post(
  '/:partyId/leave',
  auth,
  validate([
    param('partyId').isUUID().withMessage('Valid party ID required')
  ]),
  watchPartyController.leaveParty as RequestHandler
);

// Update party state (host only)
router.put(
  '/:partyId/state',
  auth,
  validate([
    param('partyId').isUUID().withMessage('Valid party ID required'),
    body('status').optional().isIn(['waiting', 'playing', 'paused', 'ended']),
    body('currentTime').optional().isFloat({ min: 0 }),
    body('isPlaying').optional().isBoolean()
  ]),
  watchPartyController.updatePartyState as RequestHandler
);

// End a watch party (host only)
router.post(
  '/:partyId/end',
  auth,
  validate([
    param('partyId').isUUID().withMessage('Valid party ID required')
  ]),
  watchPartyController.endParty as RequestHandler
);

export default router;
