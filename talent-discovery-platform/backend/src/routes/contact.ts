import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const router = Router();

// Create transporter for contact emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  } : undefined
});

// Submit contact form
router.post(
  '/',
  validate([
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 chars)'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, message } = req.body;

      // Send email to support
      await transporter.sendMail({
        from: `"Get-Noticed Contact Form" <noreply@get-noticed.com>`,
        to: process.env.CONTACT_EMAIL || 'support@get-noticed.com',
        replyTo: email,
        subject: `Contact Form: Message from ${name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #FF0000; padding: 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 30px; background: #f9f9f9; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #555; }
              .value { margin-top: 5px; }
              .message-box { background: white; padding: 15px; border-left: 4px solid #FF0000; margin-top: 10px; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">From:</div>
                  <div class="value">${name}</div>
                </div>
                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value"><a href="mailto:${email}">${email}</a></div>
                </div>
                <div class="field">
                  <div class="label">Message:</div>
                  <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
                </div>
              </div>
              <div class="footer">
                <p>This message was sent via the Get-Noticed contact form.</p>
                <p>Reply directly to this email to respond to ${name}.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
New Contact Form Submission

From: ${name}
Email: ${email}

Message:
${message}

---
Reply directly to this email to respond to ${name}.
        `
      });

      // Send confirmation to user
      await transporter.sendMail({
        from: `"Get-Noticed" <noreply@get-noticed.com>`,
        to: email,
        subject: `We received your message - Get-Noticed`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #FF0000; padding: 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
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
                <h2>Thanks for reaching out, ${name}!</h2>
                <p>We've received your message and will get back to you as soon as possible.</p>
                <p>Here's a copy of your message:</p>
                <blockquote style="background: white; padding: 15px; border-left: 4px solid #FF0000; margin: 20px 0;">
                  ${message.replace(/\n/g, '<br>')}
                </blockquote>
                <p>Best regards,<br>The Get-Noticed Team</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Get-Noticed. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Thanks for reaching out, ${name}!

We've received your message and will get back to you as soon as possible.

Here's a copy of your message:
${message}

Best regards,
The Get-Noticed Team
        `
      });

      logger.info(`Contact form submitted by ${email}`);

      res.json({
        success: true,
        message: 'Your message has been sent successfully!'
      });
    } catch (error) {
      logger.error('Contact form error:', error);
      next(error);
    }
  }
);

export default router;
