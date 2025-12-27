import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  } : undefined
});

// Email templates
const templates: Record<string, (data: any) => { html: string; text: string }> = {
  'email-verification': (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Get-Noticed</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${data.firstName}!</h2>
            <p>Thank you for joining Get-Noticed. Please verify your email address to activate your account.</p>
            <a href="${data.verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${data.verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Get-Noticed. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Get-Noticed, ${data.firstName}!

      Please verify your email address by visiting this link:
      ${data.verificationUrl}

      This link will expire in 24 hours.
    `
  }),

  'password-reset': (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Get-Noticed</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${data.firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${data.resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Get-Noticed. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Reset Your Password

      Hi ${data.firstName},

      We received a request to reset your password. Visit this link to create a new password:
      ${data.resetUrl}

      This link will expire in 1 hour.

      If you didn't request this, you can safely ignore this email.
    `
  }),

  'video-published': (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Get-Noticed</h1>
          </div>
          <div class="content">
            <h2>Your Video is Live!</h2>
            <p>Hi ${data.firstName},</p>
            <p>Great news! Your video "<strong>${data.videoTitle}</strong>" has been processed and is now live on Get-Noticed.</p>
            <a href="${data.videoUrl}" class="button">View Your Video</a>
            <p>Start sharing it with your audience and watch your talent grow!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Get-Noticed. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Your Video is Live!

      Hi ${data.firstName},

      Great news! Your video "${data.videoTitle}" has been processed and is now live on Get-Noticed.

      View it here: ${data.videoUrl}
    `
  }),

  'video-failed': (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Get-Noticed</h1>
          </div>
          <div class="content">
            <h2>Video Processing Failed</h2>
            <p>Hi ${data.firstName},</p>
            <p>We encountered an issue processing your video "<strong>${data.videoTitle}</strong>".</p>
            <p>Error: ${data.error}</p>
            <p>Please try uploading again. If the issue persists, contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Get-Noticed. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Video Processing Failed

      Hi ${data.firstName},

      We encountered an issue processing your video "${data.videoTitle}".
      Error: ${data.error}

      Please try uploading again. If the issue persists, contact our support team.
    `
  }),

  'agent-message': (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Get-Noticed</h1>
          </div>
          <div class="content">
            <h2>New Message from an Agent!</h2>
            <p>Hi ${data.firstName},</p>
            <p><strong>${data.agentName}</strong> from <strong>${data.agencyName}</strong> has sent you a message on Get-Noticed.</p>
            <a href="${data.messageUrl}" class="button">View Message</a>
            <p>This could be a great opportunity!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Get-Noticed. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      New Message from an Agent!

      Hi ${data.firstName},

      ${data.agentName} from ${data.agencyName} has sent you a message on Get-Noticed.

      View it here: ${data.messageUrl}
    `
  })
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const template = templates[options.template];
    if (!template) {
      throw new Error(`Email template '${options.template}' not found`);
    }

    const { html, text } = template(options.data);

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Get-Noticed'}" <${process.env.SMTP_FROM || 'noreply@get-noticed.com'}>`,
      to: options.to,
      subject: options.subject,
      html,
      text
    });

    logger.info(`Email sent: ${options.template} to ${options.to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

// Verify transporter connection
export const verifyConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    logger.info('Email service connected');
    return true;
  } catch (error) {
    logger.error('Email service connection failed:', error);
    return false;
  }
};

export default {
  sendEmail,
  verifyConnection
};
