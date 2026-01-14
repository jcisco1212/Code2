import { logger } from '../utils/logger';
import { PushSubscription, User } from '../models';
import { Op } from 'sequelize';

// Web Push requires these environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@get-noticed.com';

// Lazy load web-push
let webPush: any = null;

const getWebPush = () => {
  if (!webPush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
      webPush = require('web-push');
      webPush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );
    } catch (error) {
      logger.warn('web-push not installed. Push notifications will be disabled.');
    }
  }
  return webPush;
};

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  vibrate?: number[];
}

export interface PushResult {
  success: boolean;
  endpoint?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Send a push notification to a single subscription
 */
export const sendPushNotification = async (
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: PushPayload
): Promise<PushResult> => {
  const push = getWebPush();

  if (!push) {
    logger.warn('Push notification service not configured. Skipping push send.');
    return {
      success: false,
      endpoint: subscription.endpoint,
      error: 'Push service not configured'
    };
  }

  try {
    const result = await push.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 hours
        urgency: payload.data?.priority === 'urgent' ? 'high' : 'normal'
      }
    );

    logger.info(`Push notification sent to ${subscription.endpoint}`);

    return {
      success: true,
      endpoint: subscription.endpoint,
      statusCode: result.statusCode
    };
  } catch (error: any) {
    logger.error('Error sending push notification:', error);

    // Handle expired subscriptions
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Subscription has expired or been unsubscribed
      await removeInvalidSubscription(subscription.endpoint);
    }

    return {
      success: false,
      endpoint: subscription.endpoint,
      error: error.message || 'Failed to send push notification',
      statusCode: error.statusCode
    };
  }
};

/**
 * Send push notification to a user by their ID
 */
export const sendPushToUser = async (
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; results: PushResult[] }> => {
  const subscriptions = await PushSubscription.findAll({
    where: {
      userId,
      isActive: true
    }
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, results: [] };
  }

  const results: PushResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const result = await sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dhKey,
          auth: sub.authKey
        }
      },
      payload
    );

    results.push(result);
    if (result.success) {
      sent++;
      await sub.update({ lastUsedAt: new Date() });
    } else {
      failed++;
    }
  }

  return { sent, failed, results };
};

/**
 * Send push notification to multiple users
 */
export const sendPushToUsers = async (
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; skipped: number }> => {
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  // Process in batches to avoid overwhelming the system
  const batchSize = 50;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    const subscriptions = await PushSubscription.findAll({
      where: {
        userId: { [Op.in]: batch },
        isActive: true
      }
    });

    const subscriptionsByUser = new Map<string, typeof subscriptions>();
    subscriptions.forEach(sub => {
      const userId = sub.userId;
      if (!subscriptionsByUser.has(userId)) {
        subscriptionsByUser.set(userId, []);
      }
      subscriptionsByUser.get(userId)!.push(sub);
    });

    // Track users without subscriptions
    batch.forEach(userId => {
      if (!subscriptionsByUser.has(userId)) {
        skipped++;
      }
    });

    // Send to all subscriptions
    const sendPromises = subscriptions.map(sub =>
      sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dhKey,
            auth: sub.authKey
          }
        },
        payload
      ).then(result => {
        if (result.success) {
          sent++;
          sub.update({ lastUsedAt: new Date() });
        } else {
          failed++;
        }
        return result;
      })
    );

    await Promise.all(sendPromises);

    // Small delay between batches
    if (i + batchSize < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { sent, failed, skipped };
};

/**
 * Send push notification to users by role
 */
export const sendPushByRole = async (
  roles: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; skipped: number }> => {
  const users = await User.findAll({
    where: {
      role: { [Op.in]: roles },
      isActive: true
    },
    attributes: ['id']
  });

  const userIds = users.map(u => u.id);
  return sendPushToUsers(userIds, payload);
};

/**
 * Send push notification to all admins
 */
export const sendPushToAdmins = async (
  payload: PushPayload
): Promise<{ sent: number; failed: number; skipped: number }> => {
  return sendPushByRole(['admin', 'super_admin'], payload);
};

/**
 * Register a new push subscription
 */
export const registerSubscription = async (
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userAgent?: string,
  deviceName?: string
): Promise<PushSubscription> => {
  // Check if subscription already exists
  const existing = await PushSubscription.findOne({
    where: { endpoint: subscription.endpoint }
  });

  if (existing) {
    // Update existing subscription
    await existing.update({
      userId,
      p256dhKey: subscription.keys.p256dh,
      authKey: subscription.keys.auth,
      userAgent,
      deviceName,
      isActive: true,
      lastUsedAt: new Date()
    });
    return existing;
  }

  // Create new subscription
  return PushSubscription.create({
    userId,
    endpoint: subscription.endpoint,
    p256dhKey: subscription.keys.p256dh,
    authKey: subscription.keys.auth,
    userAgent,
    deviceName
  });
};

/**
 * Unregister a push subscription
 */
export const unregisterSubscription = async (
  endpoint: string
): Promise<boolean> => {
  const result = await PushSubscription.destroy({
    where: { endpoint }
  });
  return result > 0;
};

/**
 * Remove invalid subscription
 */
const removeInvalidSubscription = async (endpoint: string): Promise<void> => {
  await PushSubscription.update(
    { isActive: false },
    { where: { endpoint } }
  );
  logger.info(`Marked push subscription as inactive: ${endpoint}`);
};

/**
 * Get user's active subscriptions
 */
export const getUserSubscriptions = async (
  userId: string
): Promise<PushSubscription[]> => {
  return PushSubscription.findAll({
    where: {
      userId,
      isActive: true
    }
  });
};

/**
 * Check if push service is available
 */
export const isPushServiceAvailable = (): boolean => {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
};

/**
 * Get VAPID public key for client
 */
export const getVapidPublicKey = (): string | null => {
  return VAPID_PUBLIC_KEY || null;
};

/**
 * Push notification templates for industry events
 */
export const industryPushTemplates = {
  agentSignup: (data: { name: string; company: string; avatarUrl?: string }): PushPayload => ({
    title: '🎬 New Agent Signup',
    body: `${data.name} from ${data.company} just joined Get-Noticed`,
    icon: data.avatarUrl || '/icons/agent-icon.png',
    badge: '/icons/badge.png',
    tag: 'industry-signup',
    data: {
      type: 'agent_signup',
      url: '/admin/agents'
    },
    actions: [
      { action: 'view', title: 'View Profile' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }),

  agentVerified: (data: { name: string; company: string }): PushPayload => ({
    title: '✅ Agent Verified',
    body: `${data.name} from ${data.company} has been verified`,
    icon: '/icons/verified-icon.png',
    badge: '/icons/badge.png',
    tag: 'industry-verified',
    data: {
      type: 'agent_verified',
      url: '/admin/agents'
    }
  }),

  promoterSignup: (data: { name: string; company?: string }): PushPayload => ({
    title: '🎤 New Promoter Signup',
    body: `${data.name}${data.company ? ` from ${data.company}` : ''} just joined Get-Noticed`,
    icon: '/icons/promoter-icon.png',
    badge: '/icons/badge.png',
    tag: 'industry-signup',
    data: {
      type: 'promoter_signup',
      url: '/admin/users'
    }
  }),

  broadcastUrgent: (data: { title: string; body: string; url?: string }): PushPayload => ({
    title: `🚨 ${data.title}`,
    body: data.body,
    icon: '/icons/urgent-icon.png',
    badge: '/icons/badge.png',
    tag: 'broadcast-urgent',
    requireInteraction: true,
    data: {
      type: 'broadcast_urgent',
      url: data.url || '/',
      priority: 'urgent'
    },
    vibrate: [200, 100, 200]
  }),

  broadcastAnnouncement: (data: { title: string; body: string; url?: string; imageUrl?: string }): PushPayload => ({
    title: data.title,
    body: data.body,
    icon: '/icons/announcement-icon.png',
    image: data.imageUrl,
    badge: '/icons/badge.png',
    tag: 'broadcast-announcement',
    data: {
      type: 'broadcast_announcement',
      url: data.url || '/'
    }
  }),

  broadcastSurvey: (data: { title: string; body: string; surveyId: string }): PushPayload => ({
    title: `📊 ${data.title}`,
    body: data.body,
    icon: '/icons/survey-icon.png',
    badge: '/icons/badge.png',
    tag: 'broadcast-survey',
    data: {
      type: 'broadcast_survey',
      url: `/survey/${data.surveyId}`
    },
    actions: [
      { action: 'take_survey', title: 'Take Survey' },
      { action: 'later', title: 'Later' }
    ]
  })
};

export default {
  sendPushNotification,
  sendPushToUser,
  sendPushToUsers,
  sendPushByRole,
  sendPushToAdmins,
  registerSubscription,
  unregisterSubscription,
  getUserSubscriptions,
  isPushServiceAvailable,
  getVapidPublicKey,
  industryPushTemplates
};
