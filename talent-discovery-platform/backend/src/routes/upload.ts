import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Video, VideoStatus } from '../models';
import { generatePresignedPost, generateUploadUrl, buckets } from '../config/s3';
import { videoQueue } from '../jobs/videoQueue';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';

const router = Router();

// Upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hour
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS || '10'),
  message: {
    error: 'Too many uploads, please try again later'
  }
});

// Get presigned URL for video upload
router.post(
  '/video/presign',
  authenticate,
  uploadLimiter,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required'),
    body('contentType').notEmpty().withMessage('Content type required'),
    body('fileSize').isInt({ min: 1, max: 524288000 }).withMessage('File size must be 1 byte to 500MB')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId, contentType, fileSize } = req.body;

      // Validate content type
      const allowedTypes = (process.env.VIDEO_ALLOWED_TYPES || 'video/mp4,video/quicktime,video/x-msvideo,video/webm').split(',');
      if (!allowedTypes.includes(contentType)) {
        throw new BadRequestError(`Invalid content type. Allowed: ${allowedTypes.join(', ')}`);
      }

      // Verify video exists and belongs to user
      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }
      if (video.userId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      // Generate unique key
      const extension = contentType.split('/')[1] || 'mp4';
      const key = `videos/${req.userId}/${videoId}/original.${extension}`;

      // Generate presigned POST
      const presignedPost = await generatePresignedPost(
        key,
        contentType,
        parseInt(process.env.VIDEO_UPLOAD_MAX_SIZE || '524288000'),
        3600,
        buckets.videos
      );

      // Update video with key
      await video.update({
        originalKey: key,
        mimeType: contentType,
        fileSize,
        status: VideoStatus.PENDING
      });

      res.json({
        uploadUrl: presignedPost.url,
        fields: presignedPost.fields,
        key
      });
    } catch (error) {
      next(error);
    }
  }
);

// Confirm upload completion and start processing
router.post(
  '/video/complete',
  authenticate,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.body;

      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }
      if (video.userId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      if (!video.originalKey) {
        throw new BadRequestError('No upload key found');
      }

      // Update status and queue processing
      await video.update({ status: VideoStatus.PROCESSING });

      // Add to processing queue
      await videoQueue.add('process', {
        videoId: video.id,
        userId: req.userId,
        key: video.originalKey
      }, {
        priority: 1,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });

      logger.info(`Video ${videoId} queued for processing`);

      res.json({
        message: 'Upload complete, video processing started',
        video: video.toPublicJSON()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get presigned URL for profile image upload
router.post(
  '/profile-image/presign',
  authenticate,
  validate([
    body('contentType').isIn(['image/jpeg', 'image/png', 'image/webp']).withMessage('Invalid image type'),
    body('fileSize').isInt({ min: 1, max: 5242880 }).withMessage('File size must be 1 byte to 5MB')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { contentType, fileSize } = req.body;

      const extension = contentType.split('/')[1];
      const key = `profiles/${req.userId}/${uuidv4()}.${extension}`;

      const uploadUrl = await generateUploadUrl(key, contentType, 3600, buckets.profiles);

      res.json({
        uploadUrl,
        key,
        publicUrl: `${process.env.S3_ENDPOINT || ''}/${buckets.profiles}/${key}`
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get presigned URL for thumbnail upload (for custom thumbnails)
router.post(
  '/thumbnail/presign',
  authenticate,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required'),
    body('contentType').isIn(['image/jpeg', 'image/png', 'image/webp']).withMessage('Invalid image type'),
    body('fileSize').isInt({ min: 1, max: 2097152 }).withMessage('File size must be 1 byte to 2MB')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId, contentType, fileSize } = req.body;

      // Verify video exists and belongs to user
      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }
      if (video.userId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      const extension = contentType.split('/')[1];
      const key = `thumbnails/${req.userId}/${videoId}/custom.${extension}`;

      const uploadUrl = await generateUploadUrl(key, contentType, 3600, buckets.thumbnails);

      res.json({
        uploadUrl,
        key
      });
    } catch (error) {
      next(error);
    }
  }
);

// Confirm thumbnail upload
router.post(
  '/thumbnail/complete',
  authenticate,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required'),
    body('key').notEmpty().withMessage('Key required')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId, key } = req.body;

      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }
      if (video.userId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      const thumbnailUrl = `${process.env.S3_ENDPOINT || ''}/${buckets.thumbnails}/${key}`;
      await video.update({ thumbnailUrl });

      res.json({
        message: 'Thumbnail updated',
        thumbnailUrl
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
