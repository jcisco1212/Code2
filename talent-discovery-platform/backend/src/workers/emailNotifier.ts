import { sendEmail } from '../services/emailService';
import { logger } from '../utils/logger';

interface EmailNotificationData {
  template: string;
  to: string;
  data: Record<string, any>;
}

export async function sendEmailNotification(data: EmailNotificationData): Promise<void> {
  try {
    const { template, to, data: templateData } = data;

    const subjectMap: Record<string, string> = {
      'email-verification': 'Verify your Get-Noticed account',
      'password-reset': 'Reset your Get-Noticed password',
      'video-published': 'Your video is now live on Get-Noticed!',
      'video-failed': 'Video processing failed',
      'agent-message': 'New message from an entertainment agent'
    };

    await sendEmail({
      to,
      subject: subjectMap[template] || 'Get-Noticed Notification',
      template,
      data: templateData
    });

    logger.info(`Email notification sent: ${template} to ${to}`);
  } catch (error) {
    logger.error('Error sending email notification:', error);
    throw error;
  }
}

export default {
  sendEmailNotification
};
