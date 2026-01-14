import { logger } from '../utils/logger';

interface SMSOptions {
  to: string;
  message: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Lazy load Twilio client
let twilioClient: any = null;

const getTwilioClient = () => {
  if (!twilioClient && accountSid && authToken) {
    try {
      // Dynamic import to avoid errors if twilio is not installed
      const twilio = require('twilio');
      twilioClient = twilio(accountSid, authToken);
    } catch (error) {
      logger.warn('Twilio SDK not installed. SMS notifications will be disabled.');
    }
  }
  return twilioClient;
};

/**
 * Send an SMS message
 */
export const sendSMS = async (options: SMSOptions): Promise<SMSResult> => {
  const client = getTwilioClient();

  if (!client) {
    logger.warn('SMS service not configured. Skipping SMS send.');
    return {
      success: false,
      error: 'SMS service not configured'
    };
  }

  if (!fromNumber) {
    logger.error('TWILIO_PHONE_NUMBER not configured');
    return {
      success: false,
      error: 'SMS from number not configured'
    };
  }

  try {
    // Format phone number
    const formattedTo = formatPhoneNumber(options.to);

    const message = await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: formattedTo
    });

    logger.info(`SMS sent successfully: ${message.sid} to ${formattedTo}`);

    return {
      success: true,
      messageId: message.sid
    };
  } catch (error: any) {
    logger.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
};

/**
 * Send SMS to multiple recipients
 */
export const sendBulkSMS = async (
  recipients: string[],
  message: string
): Promise<{ success: number; failed: number; results: SMSResult[] }> => {
  const results: SMSResult[] = [];
  let success = 0;
  let failed = 0;

  // Send SMS in parallel with rate limiting
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(to => sendSMS({ to, message }))
    );

    batchResults.forEach(result => {
      results.push(result);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    });

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { success, failed, results };
};

/**
 * Verify a phone number format
 */
export const verifyPhoneNumber = async (phoneNumber: string): Promise<{
  valid: boolean;
  formattedNumber?: string;
  carrier?: string;
  type?: string;
  error?: string;
}> => {
  const client = getTwilioClient();

  if (!client) {
    // Basic validation without Twilio
    const formatted = formatPhoneNumber(phoneNumber);
    const isValid = /^\+1\d{10}$/.test(formatted);
    return {
      valid: isValid,
      formattedNumber: isValid ? formatted : undefined,
      error: isValid ? undefined : 'Invalid phone number format'
    };
  }

  try {
    const lookup = await client.lookups.v2.phoneNumbers(phoneNumber).fetch({
      fields: 'line_type_intelligence'
    });

    return {
      valid: true,
      formattedNumber: lookup.phoneNumber,
      type: lookup.lineTypeIntelligence?.type
    };
  } catch (error: any) {
    logger.error('Error verifying phone number:', error);
    return {
      valid: false,
      error: error.message || 'Failed to verify phone number'
    };
  }
};

/**
 * Send verification code via SMS
 */
export const sendVerificationCode = async (
  phoneNumber: string,
  code: string
): Promise<SMSResult> => {
  const message = `Your Get-Noticed verification code is: ${code}. This code expires in 10 minutes.`;
  return sendSMS({ to: phoneNumber, message });
};

/**
 * Format phone number to E.164 format
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  let digits = phoneNumber.replace(/\D/g, '');

  // Handle US numbers
  if (digits.length === 10) {
    digits = '1' + digits;
  }

  // Add + prefix
  if (!digits.startsWith('+')) {
    digits = '+' + digits;
  }

  return digits;
};

/**
 * Check if SMS service is configured and available
 */
export const isSMSServiceAvailable = (): boolean => {
  return !!(accountSid && authToken && fromNumber);
};

/**
 * SMS notification templates for industry events
 */
export const industryNotificationTemplates = {
  agentSignup: (data: { name: string; company: string }) =>
    `🎬 New agent signup on Get-Noticed! ${data.name} from ${data.company} just joined the platform.`,

  agentVerified: (data: { name: string; company: string }) =>
    `✅ Agent verified: ${data.name} from ${data.company} has been verified on Get-Noticed.`,

  promoterSignup: (data: { name: string; company?: string }) =>
    `🎤 New promoter signup! ${data.name}${data.company ? ` from ${data.company}` : ''} just joined Get-Noticed.`,

  managerSignup: (data: { name: string; company?: string }) =>
    `📋 New talent manager signup! ${data.name}${data.company ? ` from ${data.company}` : ''} just joined Get-Noticed.`,

  castingDirectorSignup: (data: { name: string; company?: string }) =>
    `🎥 New casting director signup! ${data.name}${data.company ? ` from ${data.company}` : ''} just joined Get-Noticed.`,

  producerSignup: (data: { name: string; company?: string }) =>
    `🎬 New producer signup! ${data.name}${data.company ? ` from ${data.company}` : ''} just joined Get-Noticed.`,

  industryContact: (data: { name: string; message: string }) =>
    `📨 Industry inquiry from ${data.name}: "${data.message.substring(0, 100)}${data.message.length > 100 ? '...' : ''}"`,

  broadcastUrgent: (data: { title: string }) =>
    `🚨 URGENT from Get-Noticed: ${data.title}. Please check the app for details.`,

  broadcastAnnouncement: (data: { title: string }) =>
    `📢 Get-Noticed: ${data.title}. Open the app for more info.`
};

export default {
  sendSMS,
  sendBulkSMS,
  verifyPhoneNumber,
  sendVerificationCode,
  isSMSServiceAvailable,
  industryNotificationTemplates
};
