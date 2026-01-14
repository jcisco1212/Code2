import { Server as SocketServer } from 'socket.io';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import {
  User,
  UserRole,
  IndustryNotification,
  IndustryEventType,
  IndustryNotificationStatus,
  BroadcastNotification,
  BroadcastTarget,
  BroadcastStatus,
  BroadcastPriority,
  UserBroadcastStatus,
  BroadcastUserStatus,
  AdminNotificationSettings,
  AdminIndustryNotificationStatus,
  AdminNotificationStatus
} from '../models';
import { sendSMS, industryNotificationTemplates } from './smsService';
import { sendPushToUser, sendPushToAdmins, sendPushToUsers, industryPushTemplates, PushPayload } from './pushNotificationService';
import { sendEmail } from './emailService';

// Socket.io instance - will be set by the main app
let io: SocketServer | null = null;

/**
 * Set the Socket.io instance
 */
export const setSocketIO = (socketIO: SocketServer): void => {
  io = socketIO;
  setupSocketHandlers();
};

/**
 * Setup Socket.io event handlers for notifications
 */
const setupSocketHandlers = (): void => {
  if (!io) return;

  io.on('connection', (socket) => {
    // Join user's personal notification room
    socket.on('join-notifications', (userId: string) => {
      socket.join(`user:${userId}`);
      socket.join(`notifications:${userId}`);
      logger.info(`User ${userId} joined notification room`);
    });

    // Join admin notification room
    socket.on('join-admin-notifications', (userId: string, role: string) => {
      if (role === 'admin' || role === 'super_admin') {
        socket.join('admin-notifications');
        socket.join(`admin:${userId}`);
        logger.info(`Admin ${userId} joined admin notification room`);
      }
    });

    // Leave notification rooms
    socket.on('leave-notifications', (userId: string) => {
      socket.leave(`user:${userId}`);
      socket.leave(`notifications:${userId}`);
      socket.leave('admin-notifications');
      socket.leave(`admin:${userId}`);
    });

    // Mark notification as viewed
    socket.on('notification-viewed', async (notificationId: string, userId: string) => {
      try {
        await markNotificationViewed(notificationId, userId);
      } catch (error) {
        logger.error('Error marking notification as viewed:', error);
      }
    });

    // Mark broadcast as viewed/dismissed
    socket.on('broadcast-viewed', async (broadcastId: string, userId: string) => {
      try {
        await markBroadcastViewed(broadcastId, userId);
      } catch (error) {
        logger.error('Error marking broadcast as viewed:', error);
      }
    });

    socket.on('broadcast-dismissed', async (broadcastId: string, userId: string) => {
      try {
        await markBroadcastDismissed(broadcastId, userId);
      } catch (error) {
        logger.error('Error marking broadcast as dismissed:', error);
      }
    });
  });
};

/**
 * Emit a real-time notification to a specific user
 */
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    io.to(`notifications:${userId}`).emit(event, data);
  }
};

/**
 * Emit a notification to all admins
 */
export const emitToAdmins = (event: string, data: any): void => {
  if (io) {
    io.to('admin-notifications').emit(event, data);
  }
};

/**
 * Emit a notification to a specific admin
 */
export const emitToAdmin = (adminId: string, event: string, data: any): void => {
  if (io) {
    io.to(`admin:${adminId}`).emit(event, data);
  }
};

/**
 * Emit a broadcast notification to all connected users
 */
export const emitBroadcast = (event: string, data: any, targets?: BroadcastTarget[]): void => {
  if (io) {
    if (!targets || targets.includes(BroadcastTarget.ALL)) {
      io.emit(event, data);
    } else {
      // For targeted broadcasts, we emit to all and let clients filter
      io.emit(event, { ...data, targets });
    }
  }
};

// ===== Industry Notification Functions =====

/**
 * Create and send an industry notification to all admins
 */
export const createIndustryNotification = async (
  eventType: IndustryEventType,
  userId: string,
  title: string,
  message: string,
  data: Record<string, any> = {}
): Promise<IndustryNotification> => {
  // Create the notification record
  const notification = await IndustryNotification.create({
    eventType,
    userId,
    title,
    message,
    data,
    status: IndustryNotificationStatus.PENDING
  });

  // Get all admins and super admins with their notification settings
  const admins = await User.findAll({
    where: {
      role: { [Op.in]: ['admin', 'super_admin'] },
      isActive: true
    },
    include: [{
      model: AdminNotificationSettings,
      as: 'adminNotificationSettings',
      required: false
    }]
  });

  // Process notifications for each admin
  for (const admin of admins) {
    const settings = (admin as any).adminNotificationSettings as AdminNotificationSettings | null;

    // Check if this event type should be notified
    if (!shouldNotifyAdmin(settings, eventType)) {
      continue;
    }

    // Check quiet hours
    if (settings && isInQuietHours(settings)) {
      continue;
    }

    // Create status record for this admin
    await AdminIndustryNotificationStatus.create({
      adminId: admin.id,
      industryNotificationId: notification.id,
      status: AdminNotificationStatus.PENDING
    });

    // Send popup notification via Socket.io
    if (!settings || settings.industryPopupEnabled) {
      emitToAdmin(admin.id, 'industry-notification', {
        id: notification.id,
        eventType,
        title,
        message,
        data,
        createdAt: notification.createdAt
      });
    }

    // Send push notification
    if (!settings || settings.industryPushEnabled) {
      const pushPayload = getIndustryPushPayload(eventType, data);
      if (pushPayload) {
        await sendPushToUser(admin.id, pushPayload);
      }
    }

    // Send SMS notification
    if (settings?.industrySmsEnabled && settings?.smsPhoneNumber && settings?.smsVerified) {
      const smsMessage = getIndustrySMSMessage(eventType, data);
      if (smsMessage) {
        await sendSMS({ to: settings.smsPhoneNumber, message: smsMessage });
      }
    }

    // Send email notification
    if (!settings || settings.industryEmailEnabled) {
      // Email sending would go here - using existing email service
    }
  }

  await notification.update({
    status: IndustryNotificationStatus.SENT,
    popupSent: true,
    pushSent: true
  });

  return notification;
};

/**
 * Check if admin should be notified for this event type
 */
const shouldNotifyAdmin = (settings: AdminNotificationSettings | null, eventType: IndustryEventType): boolean => {
  if (!settings) return true; // Default to all notifications if no settings

  switch (eventType) {
    case IndustryEventType.AGENT_SIGNUP:
      return settings.agentSignupNotify;
    case IndustryEventType.AGENT_VERIFIED:
      return settings.agentVerifiedNotify;
    case IndustryEventType.PROMOTER_SIGNUP:
      return settings.promoterSignupNotify;
    case IndustryEventType.MANAGER_SIGNUP:
      return settings.managerSignupNotify;
    case IndustryEventType.CASTING_DIRECTOR_SIGNUP:
      return settings.castingDirectorSignupNotify;
    case IndustryEventType.PRODUCER_SIGNUP:
      return settings.producerSignupNotify;
    case IndustryEventType.INDUSTRY_CONTACT:
      return settings.industryContactNotify;
    default:
      return true;
  }
};

/**
 * Check if current time is within quiet hours
 */
const isInQuietHours = (settings: AdminNotificationSettings): boolean => {
  if (!settings.quietHoursEnabled || !settings.quietHoursStart || !settings.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const timezone = settings.quietHoursTimezone || 'UTC';

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const currentTime = formatter.format(now);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = settings.quietHoursStart.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = settings.quietHoursEnd.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } catch {
    return false;
  }
};

/**
 * Get push payload for industry event
 */
const getIndustryPushPayload = (eventType: IndustryEventType, data: Record<string, any>): PushPayload | null => {
  switch (eventType) {
    case IndustryEventType.AGENT_SIGNUP:
      return industryPushTemplates.agentSignup({
        name: data.name || 'Unknown',
        company: data.company || 'Unknown Agency',
        avatarUrl: data.avatarUrl
      });
    case IndustryEventType.AGENT_VERIFIED:
      return industryPushTemplates.agentVerified({
        name: data.name || 'Unknown',
        company: data.company || 'Unknown Agency'
      });
    case IndustryEventType.PROMOTER_SIGNUP:
      return industryPushTemplates.promoterSignup({
        name: data.name || 'Unknown',
        company: data.company
      });
    default:
      return null;
  }
};

/**
 * Get SMS message for industry event
 */
const getIndustrySMSMessage = (eventType: IndustryEventType, data: Record<string, any>): string | null => {
  switch (eventType) {
    case IndustryEventType.AGENT_SIGNUP:
      return industryNotificationTemplates.agentSignup({
        name: data.name || 'Unknown',
        company: data.company || 'Unknown Agency'
      });
    case IndustryEventType.AGENT_VERIFIED:
      return industryNotificationTemplates.agentVerified({
        name: data.name || 'Unknown',
        company: data.company || 'Unknown Agency'
      });
    case IndustryEventType.PROMOTER_SIGNUP:
      return industryNotificationTemplates.promoterSignup({
        name: data.name || 'Unknown',
        company: data.company
      });
    case IndustryEventType.MANAGER_SIGNUP:
      return industryNotificationTemplates.managerSignup({
        name: data.name || 'Unknown',
        company: data.company
      });
    case IndustryEventType.CASTING_DIRECTOR_SIGNUP:
      return industryNotificationTemplates.castingDirectorSignup({
        name: data.name || 'Unknown',
        company: data.company
      });
    case IndustryEventType.PRODUCER_SIGNUP:
      return industryNotificationTemplates.producerSignup({
        name: data.name || 'Unknown',
        company: data.company
      });
    case IndustryEventType.INDUSTRY_CONTACT:
      return industryNotificationTemplates.industryContact({
        name: data.name || 'Unknown',
        message: data.message || ''
      });
    default:
      return null;
  }
};

/**
 * Mark industry notification as viewed by admin
 */
const markNotificationViewed = async (notificationId: string, adminId: string): Promise<void> => {
  await AdminIndustryNotificationStatus.update(
    {
      status: AdminNotificationStatus.VIEWED,
      viewedAt: new Date()
    },
    {
      where: {
        industryNotificationId: notificationId,
        adminId
      }
    }
  );
};

// ===== Broadcast Notification Functions =====

/**
 * Create and send a broadcast notification
 */
export const createBroadcastNotification = async (
  type: string,
  title: string,
  message: string,
  options: {
    targets?: BroadcastTarget[];
    priority?: BroadcastPriority;
    showPopup?: boolean;
    sendPush?: boolean;
    sendEmail?: boolean;
    sendSms?: boolean;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    dismissible?: boolean;
    requireAcknowledge?: boolean;
    surveyData?: Record<string, any>;
    scheduledAt?: Date;
    expiresAt?: Date;
    createdBy: string;
    data?: Record<string, any>;
  }
): Promise<BroadcastNotification> => {
  const broadcast = await BroadcastNotification.create({
    type: type as any,
    title,
    message,
    targets: options.targets || [BroadcastTarget.ALL],
    priority: options.priority || BroadcastPriority.NORMAL,
    showPopup: options.showPopup !== false,
    sendPush: options.sendPush !== false,
    sendEmail: options.sendEmail || false,
    sendSms: options.sendSms || false,
    actionUrl: options.actionUrl,
    actionText: options.actionText,
    imageUrl: options.imageUrl,
    dismissible: options.dismissible !== false,
    requireAcknowledge: options.requireAcknowledge || false,
    surveyData: options.surveyData,
    scheduledAt: options.scheduledAt,
    expiresAt: options.expiresAt,
    createdBy: options.createdBy,
    data: options.data || {},
    status: options.scheduledAt ? BroadcastStatus.SCHEDULED : BroadcastStatus.ACTIVE
  });

  // If not scheduled, send immediately
  if (!options.scheduledAt) {
    await sendBroadcastNotification(broadcast);
  }

  return broadcast;
};

/**
 * Send a broadcast notification to all targeted users
 */
export const sendBroadcastNotification = async (
  broadcast: BroadcastNotification
): Promise<{ sent: number; failed: number }> => {
  const targets = broadcast.targets || [BroadcastTarget.ALL];
  let sent = 0;
  let failed = 0;

  // Get target users based on targets
  const users = await getTargetUsers(targets);

  // Create user broadcast status records and send notifications
  for (const user of users) {
    try {
      // Create status record
      await UserBroadcastStatus.create({
        userId: user.id,
        broadcastId: broadcast.id,
        status: BroadcastUserStatus.PENDING
      });

      // Send popup via Socket.io
      if (broadcast.showPopup) {
        emitToUser(user.id, 'broadcast-notification', {
          id: broadcast.id,
          type: broadcast.type,
          title: broadcast.title,
          message: broadcast.message,
          actionUrl: broadcast.actionUrl,
          actionText: broadcast.actionText,
          imageUrl: broadcast.imageUrl,
          priority: broadcast.priority,
          dismissible: broadcast.dismissible,
          requireAcknowledge: broadcast.requireAcknowledge,
          surveyData: broadcast.surveyData,
          createdAt: broadcast.createdAt
        });
      }

      sent++;
    } catch (error) {
      logger.error(`Failed to send broadcast to user ${user.id}:`, error);
      failed++;
    }
  }

  // Send push notifications in bulk
  if (broadcast.sendPush) {
    const userIds = users.map(u => u.id);
    const pushPayload = getBroadcastPushPayload(broadcast);
    await sendPushToUsers(userIds, pushPayload);
  }

  // Update broadcast stats
  await broadcast.update({
    totalSent: sent,
    status: BroadcastStatus.ACTIVE
  });

  return { sent, failed };
};

/**
 * Get users based on broadcast targets
 */
const getTargetUsers = async (targets: BroadcastTarget[]): Promise<User[]> => {
  const roleMap: Record<BroadcastTarget, string[]> = {
    [BroadcastTarget.ALL]: ['user', 'creator', 'agent', 'admin', 'super_admin'],
    [BroadcastTarget.USERS]: ['user'],
    [BroadcastTarget.CREATORS]: ['creator'],
    [BroadcastTarget.AGENTS]: ['agent'],
    [BroadcastTarget.ADMINS]: ['admin'],
    [BroadcastTarget.SUPER_ADMINS]: ['super_admin'],
    [BroadcastTarget.ENTERTAINMENT_PROFESSIONALS]: ['agent']
  };

  const roles = new Set<string>();
  targets.forEach(target => {
    const targetRoles = roleMap[target] || [];
    targetRoles.forEach(role => roles.add(role));
  });

  return User.findAll({
    where: {
      role: { [Op.in]: Array.from(roles) },
      isActive: true
    },
    attributes: ['id', 'email', 'role']
  });
};

/**
 * Get push payload for broadcast
 */
const getBroadcastPushPayload = (broadcast: BroadcastNotification): PushPayload => {
  if (broadcast.priority === BroadcastPriority.URGENT) {
    return industryPushTemplates.broadcastUrgent({
      title: broadcast.title,
      body: broadcast.message,
      url: broadcast.actionUrl || undefined
    });
  }

  if (broadcast.surveyData) {
    return industryPushTemplates.broadcastSurvey({
      title: broadcast.title,
      body: broadcast.message,
      surveyId: broadcast.id
    });
  }

  return industryPushTemplates.broadcastAnnouncement({
    title: broadcast.title,
    body: broadcast.message,
    url: broadcast.actionUrl || undefined,
    imageUrl: broadcast.imageUrl || undefined
  });
};

/**
 * Mark broadcast as viewed by user
 */
export const markBroadcastViewed = async (broadcastId: string, userId: string): Promise<void> => {
  await UserBroadcastStatus.update(
    {
      status: BroadcastUserStatus.VIEWED,
      viewedAt: new Date()
    },
    {
      where: {
        broadcastId,
        userId
      }
    }
  );

  // Update broadcast stats
  await BroadcastNotification.increment('totalViewed', {
    where: { id: broadcastId }
  });
};

/**
 * Mark broadcast as dismissed by user
 */
export const markBroadcastDismissed = async (broadcastId: string, userId: string): Promise<void> => {
  await UserBroadcastStatus.update(
    {
      status: BroadcastUserStatus.DISMISSED,
      dismissedAt: new Date()
    },
    {
      where: {
        broadcastId,
        userId
      }
    }
  );

  // Update broadcast stats
  await BroadcastNotification.increment('totalDismissed', {
    where: { id: broadcastId }
  });
};

/**
 * Mark broadcast as acknowledged by user (for required acknowledge broadcasts)
 */
export const acknowledgeBroadcast = async (
  broadcastId: string,
  userId: string,
  surveyResponse?: Record<string, any>
): Promise<void> => {
  await UserBroadcastStatus.update(
    {
      status: BroadcastUserStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date(),
      surveyResponse: surveyResponse || null
    },
    {
      where: {
        broadcastId,
        userId
      }
    }
  );

  // Update broadcast stats
  await BroadcastNotification.increment('totalAcknowledged', {
    where: { id: broadcastId }
  });
};

/**
 * Get pending broadcasts for a user
 */
export const getPendingBroadcasts = async (userId: string, userRole: string): Promise<BroadcastNotification[]> => {
  // Get broadcasts the user hasn't seen yet
  const viewedBroadcastIds = await UserBroadcastStatus.findAll({
    where: { userId },
    attributes: ['broadcastId']
  }).then(statuses => statuses.map(s => s.broadcastId));

  const roleTargetMap: Record<string, BroadcastTarget[]> = {
    user: [BroadcastTarget.ALL, BroadcastTarget.USERS],
    creator: [BroadcastTarget.ALL, BroadcastTarget.CREATORS],
    agent: [BroadcastTarget.ALL, BroadcastTarget.AGENTS, BroadcastTarget.ENTERTAINMENT_PROFESSIONALS],
    admin: [BroadcastTarget.ALL, BroadcastTarget.ADMINS],
    super_admin: [BroadcastTarget.ALL, BroadcastTarget.SUPER_ADMINS, BroadcastTarget.ADMINS]
  };

  const applicableTargets = roleTargetMap[userRole] || [BroadcastTarget.ALL];

  return BroadcastNotification.findAll({
    where: {
      id: { [Op.notIn]: viewedBroadcastIds },
      status: BroadcastStatus.ACTIVE,
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } }
      ],
      // Using raw query for array overlap
      targets: { [Op.overlap]: applicableTargets }
    },
    order: [
      ['priority', 'DESC'],
      ['createdAt', 'DESC']
    ]
  });
};

/**
 * Get pending industry notifications for an admin
 */
export const getPendingIndustryNotifications = async (adminId: string): Promise<IndustryNotification[]> => {
  const viewedNotificationIds = await AdminIndustryNotificationStatus.findAll({
    where: {
      adminId,
      status: { [Op.in]: [AdminNotificationStatus.VIEWED, AdminNotificationStatus.DISMISSED] }
    },
    attributes: ['industryNotificationId']
  }).then(statuses => statuses.map(s => s.industryNotificationId));

  return IndustryNotification.findAll({
    where: {
      id: { [Op.notIn]: viewedNotificationIds }
    },
    include: [{
      model: User,
      as: 'industryUser',
      attributes: ['id', 'username', 'displayName', 'avatarUrl', 'role', 'agentCompanyName']
    }],
    order: [['createdAt', 'DESC']],
    limit: 50
  });
};

export default {
  setSocketIO,
  emitToUser,
  emitToAdmins,
  emitToAdmin,
  emitBroadcast,
  createIndustryNotification,
  createBroadcastNotification,
  sendBroadcastNotification,
  markBroadcastViewed,
  markBroadcastDismissed,
  acknowledgeBroadcast,
  getPendingBroadcasts,
  getPendingIndustryNotifications
};
