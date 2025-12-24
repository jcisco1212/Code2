import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { User } from '../models';
import { cacheDelete } from '../config/redis';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for profile image uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Get current user's profile
router.get('/me', authenticate as RequestHandler, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ profile: req.user!.toAuthJSON() });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put(
  '/me',
  authenticate as RequestHandler,
  validate([
    body('firstName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be 1-100 chars'),
    body('lastName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be 1-100 chars'),
    body('displayName').optional().trim().isLength({ max: 100 }).withMessage('Display name must be max 100 chars'),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be max 500 chars'),
    body('location').optional().trim().isLength({ max: 255 }).withMessage('Location must be max 255 chars'),
    body('website').optional({ checkFalsy: true }).trim().isURL().withMessage('Invalid website URL'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    body('talentCategories').optional().isArray().withMessage('Talent categories must be an array'),
    body('photoGallery').optional().isArray({ max: 4 }).withMessage('Photo gallery must be an array with max 4 items'),
    body('ethnicity').optional().trim().isLength({ max: 100 }).withMessage('Ethnicity must be max 100 chars'),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender value')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { firstName, lastName, displayName, bio, location, website, dateOfBirth, talentCategories, photoGallery, ethnicity, gender } = req.body;

      await user.update({
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(talentCategories && { talentCategories }),
        ...(photoGallery !== undefined && { photoGallery }),
        ...(ethnicity !== undefined && { ethnicity }),
        ...(gender !== undefined && { gender })
      });

      // Clear cache
      await cacheDelete(`user:${user.id}`);

      res.json({ profile: user.toAuthJSON() });
    } catch (error) {
      next(error);
    }
  }
);

// Update profile image (file upload)
router.put(
  '/me/image',
  authenticate as RequestHandler,
  profileUpload.single('image'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      // Handle file upload
      if (req.file) {
        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        await user.update({ avatarUrl: imageUrl });

        // Clear cache
        await cacheDelete(`user:${user.id}`);

        res.json({
          message: 'Profile image updated',
          avatarUrl: imageUrl
        });
        return;
      }

      // Handle URL in body (legacy support)
      const { profileImageUrl, avatarUrl } = req.body;
      const newUrl = profileImageUrl || avatarUrl;

      if (newUrl) {
        await user.update({ avatarUrl: newUrl });

        // Clear cache
        await cacheDelete(`user:${user.id}`);

        res.json({
          message: 'Profile image updated',
          avatarUrl: newUrl
        });
        return;
      }

      res.status(400).json({ error: 'No image file or URL provided' });
    } catch (error) {
      next(error);
    }
  }
);

// Update username
router.put(
  '/me/username',
  authenticate as RequestHandler,
  validate([
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-50 chars, alphanumeric and underscores only')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { username } = req.body;

      // Check if username is taken
      const existing = await User.findOne({
        where: { username }
      });

      if (existing && existing.id !== user.id) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }

      await user.update({ username });

      // Clear cache
      await cacheDelete(`user:${user.id}`);

      res.json({ username: user.username });
    } catch (error) {
      next(error);
    }
  }
);

// Upgrade to creator role
router.post('/me/upgrade-creator', authenticate as RequestHandler, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    if (user.role !== 'user') {
      res.status(400).json({ error: 'Already a creator or agent' });
      return;
    }

    await user.update({ role: 'creator' });

    res.json({
      message: 'Upgraded to creator',
      role: user.role
    });
  } catch (error) {
    next(error);
  }
});

// Request agent verification
router.post(
  '/me/request-agent',
  authenticate as RequestHandler,
  validate([
    body('agencyName').trim().isLength({ min: 1, max: 255 }).withMessage('Agency name required'),
    body('verificationDocuments').optional().isArray().withMessage('Documents must be an array')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { agencyName } = req.body;

      await user.update({
        role: 'agent',
        agencyName,
        agencyVerified: false
      });

      // TODO: Create verification request for admin review

      res.json({
        message: 'Agent request submitted for review',
        agencyName
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get notification settings
router.get('/me/settings/notifications', authenticate as RequestHandler, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement notification settings model
    res.json({
      settings: {
        emailNewFollower: true,
        emailNewComment: true,
        emailVideoPublished: true,
        emailAgentMessage: true,
        pushEnabled: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update notification settings
router.put(
  '/me/settings/notifications',
  authenticate as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { settings } = req.body;
      // TODO: Save notification settings
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  }
);

// Update social links
router.put(
  '/me/social-links',
  authenticate as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { socialLinks } = req.body;

      // Validate that socialLinks is an object
      if (typeof socialLinks !== 'object' || socialLinks === null) {
        res.status(400).json({ error: 'Invalid social links data' });
        return;
      }

      // Filter to only allowed keys
      const allowedKeys = ['website', 'imdb', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'spotify', 'soundcloud', 'agency'];
      const filteredLinks: Record<string, string> = {};

      for (const key of allowedKeys) {
        if (socialLinks[key] !== undefined && socialLinks[key] !== '') {
          filteredLinks[key] = String(socialLinks[key]).trim();
        }
      }

      await user.update({ socialLinks: filteredLinks });

      // Clear cache
      await cacheDelete(`user:${user.id}`);

      res.json({
        message: 'Social links updated',
        socialLinks: user.socialLinks
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update notification settings
router.put(
  '/me/notifications',
  authenticate as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { settings } = req.body;
      // TODO: Save notification settings to database
      // For now, just return success
      res.json({
        message: 'Notification settings updated',
        settings
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update privacy settings
router.put(
  '/me/privacy',
  authenticate as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { settings } = req.body;

      // Merge with existing privacy settings
      const currentPrivacy = user.privacySettings || {
        showAge: true,
        showDateOfBirth: false,
        showEthnicity: true,
        showLocation: true,
        showGender: true
      };

      const updatedPrivacy = {
        ...currentPrivacy,
        ...(settings.showAge !== undefined && { showAge: Boolean(settings.showAge) }),
        ...(settings.showDateOfBirth !== undefined && { showDateOfBirth: Boolean(settings.showDateOfBirth) }),
        ...(settings.showEthnicity !== undefined && { showEthnicity: Boolean(settings.showEthnicity) }),
        ...(settings.showLocation !== undefined && { showLocation: Boolean(settings.showLocation) }),
        ...(settings.showGender !== undefined && { showGender: Boolean(settings.showGender) })
      };

      await user.update({ privacySettings: updatedPrivacy });

      // Clear cache
      await cacheDelete(`user:${user.id}`);

      res.json({
        message: 'Privacy settings updated',
        settings: updatedPrivacy
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete account
router.delete('/me', authenticate as RequestHandler, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    // Soft delete - mark as banned with special status
    await user.update({ status: 'banned' });

    // TODO: Queue cleanup job to anonymize data

    res.json({ message: 'Account deletion initiated' });
  } catch (error) {
    next(error);
  }
});

export default router;
