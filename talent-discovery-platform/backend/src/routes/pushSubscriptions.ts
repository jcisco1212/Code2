import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { PushSubscription } from '../models';
import {
  registerSubscription,
  unregisterSubscription,
  getUserSubscriptions,
  isPushServiceAvailable,
  getVapidPublicKey,
  sendPushToUser
} from '../services/pushNotificationService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/push-subscriptions/vapid-key
 * Get the VAPID public key for client-side push subscription
 */
router.get('/vapid-key', (req: Request, res: Response) => {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return res.status(503).json({
      error: 'Push notifications not configured',
      available: false
    });
  }

  res.json({
    publicKey,
    available: true
  });
});

/**
 * GET /api/v1/push-subscriptions/status
 * Check if push notifications are available
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    available: isPushServiceAvailable(),
    publicKey: getVapidPublicKey()
  });
});

/**
 * GET /api/v1/push-subscriptions
 * Get current user's push subscriptions
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const subscriptions = await getUserSubscriptions(userId);

    res.json({
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        deviceName: sub.deviceName,
        userAgent: sub.userAgent,
        isActive: sub.isActive,
        lastUsedAt: sub.lastUsedAt,
        createdAt: sub.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/push-subscriptions
 * Register a new push subscription
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscription, deviceName } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    if (!subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ error: 'Missing subscription keys' });
    }

    const userAgent = req.headers['user-agent'] as string;

    const pushSubscription = await registerSubscription(
      req.user!.id,
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      userAgent,
      deviceName
    );

    logger.info(`Push subscription registered for user ${req.user!.id}`);

    res.status(201).json({
      success: true,
      subscriptionId: pushSubscription.id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/push-subscriptions/:id
 * Remove a specific push subscription
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Find the subscription and verify ownership
    const subscription = await PushSubscription.findOne({
      where: { id, userId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await subscription.destroy();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/push-subscriptions/unsubscribe
 * Unsubscribe by endpoint
 */
router.post('/unsubscribe', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    const success = await unregisterSubscription(endpoint);

    res.json({ success });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/push-subscriptions/test
 * Send a test push notification to verify subscription works
 */
router.post('/test', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const result = await sendPushToUser(userId, {
      title: 'Test Notification',
      body: 'This is a test push notification from Get-Noticed!',
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge.png',
      tag: 'test',
      data: {
        type: 'test',
        url: '/'
      }
    });

    if (result.sent === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active push subscriptions found',
        message: 'Please enable push notifications in your browser first'
      });
    }

    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/push-subscriptions/:id/name
 * Update subscription device name
 */
router.put('/:id/name', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { deviceName } = req.body;
    const userId = req.user!.id;

    const subscription = await PushSubscription.findOne({
      where: { id, userId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await subscription.update({ deviceName });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/push-subscriptions/all
 * Remove all push subscriptions for current user
 */
router.delete('/all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const deletedCount = await PushSubscription.destroy({
      where: { userId }
    });

    res.json({
      success: true,
      deletedCount
    });
  } catch (error) {
    next(error);
  }
});

export default router;
