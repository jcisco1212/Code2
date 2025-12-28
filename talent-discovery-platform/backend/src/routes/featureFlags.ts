import { Router, RequestHandler } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as featureFlagController from '../controllers/featureFlagController';

const router = Router();

// Cast middleware to RequestHandler
const auth = authenticate as RequestHandler;
const optAuth = optionalAuth as RequestHandler;

// Admin/Super Admin middleware
const adminAuth: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!['admin', 'super_admin'].includes(user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Super Admin only middleware
const superAdminAuth: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  next();
};

// Public: Get enabled features (for frontend)
router.get('/enabled', optAuth, featureFlagController.getEnabledFeatures as RequestHandler);

// Public: Check if a specific feature is enabled
router.get(
  '/check/:key',
  optAuth,
  validate([
    param('key').isLength({ min: 1, max: 100 }).withMessage('Valid feature key required')
  ]),
  featureFlagController.checkFeature as RequestHandler
);

// Admin: Get all feature flags
router.get(
  '/',
  auth,
  adminAuth,
  validate([
    query('category').optional().isIn(['all', 'content', 'social', 'engagement', 'monetization', 'ai', 'admin', 'experimental'])
  ]),
  featureFlagController.getAllFlags as RequestHandler
);

// Admin: Get statistics
router.get('/stats', auth, adminAuth, featureFlagController.getStats as RequestHandler);

// Admin: Toggle a feature
router.put(
  '/:flagId/toggle',
  auth,
  adminAuth,
  validate([
    param('flagId').isUUID().withMessage('Valid flag ID required'),
    body('isEnabled').isBoolean().withMessage('isEnabled must be a boolean')
  ]),
  featureFlagController.toggleFeature as RequestHandler
);

// Admin: Bulk toggle features
router.put(
  '/bulk-toggle',
  auth,
  adminAuth,
  validate([
    body('flagIds').isArray({ min: 1 }).withMessage('At least one flag ID required'),
    body('isEnabled').isBoolean().withMessage('isEnabled must be a boolean')
  ]),
  featureFlagController.bulkToggle as RequestHandler
);

// Admin: Update a feature flag
router.put(
  '/:flagId',
  auth,
  adminAuth,
  validate([
    param('flagId').isUUID().withMessage('Valid flag ID required'),
    body('name').optional().isLength({ min: 1, max: 200 }),
    body('description').optional().isLength({ max: 1000 }),
    body('isEnabled').optional().isBoolean(),
    body('enabledForRoles').optional().isArray(),
    body('config').optional().isObject()
  ]),
  featureFlagController.updateFlag as RequestHandler
);

// Super Admin: Create a new feature flag
router.post(
  '/',
  auth,
  superAdminAuth,
  validate([
    body('key').isLength({ min: 1, max: 100 }).matches(/^[a-z_]+$/).withMessage('Key must be lowercase with underscores'),
    body('name').isLength({ min: 1, max: 200 }).withMessage('Name required'),
    body('description').optional().isLength({ max: 1000 }),
    body('category').optional().isIn(['content', 'social', 'engagement', 'monetization', 'ai', 'admin', 'experimental']),
    body('isEnabled').optional().isBoolean(),
    body('enabledForRoles').optional().isArray(),
    body('config').optional().isObject()
  ]),
  featureFlagController.createFlag as RequestHandler
);

// Super Admin: Seed default feature flags
router.post('/seed', auth, superAdminAuth, featureFlagController.seedFlags as RequestHandler);

// Super Admin: Delete a feature flag
router.delete(
  '/:flagId',
  auth,
  superAdminAuth,
  validate([
    param('flagId').isUUID().withMessage('Valid flag ID required')
  ]),
  featureFlagController.deleteFlag as RequestHandler
);

export default router;
