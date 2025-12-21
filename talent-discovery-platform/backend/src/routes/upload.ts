import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Video, VideoStatus } from '../models';
import { generatePresignedPost, generateUploadUrl, buckets } from '../config/s3';
import { videoQueue } from '../jobs/videoQueue';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
import { cacheDelete } from '../config/redis';
import ffmpeg from 'fluent-ffmpeg';

const router = Router();

// Transcode video to web-compatible MP4
function transcodeToWebMP4(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',        // H.264 video codec
        '-preset fast',         // Encoding speed
        '-crf 23',              // Quality level
        '-c:a aac',             // AAC audio codec
        '-b:a 128k',            // Audio bitrate
        '-movflags +faststart', // Enable fast start for web
        '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2' // Ensure even dimensions
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

// Get video duration using ffprobe
function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(Math.floor(metadata.format.duration || 0));
    });
  });
}

// Local uploads directory for development
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');

// Ensure upload directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

// Multer configuration for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const authReq = req;
    const userDir = path.join(VIDEOS_DIR, authReq.userId || 'anonymous');
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    // Expanded MIME types for better compatibility
    const allowedTypes = [
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'video/x-m4v', 'video/x-matroska', 'video/mpeg', 'video/3gpp',
      'video/x-ms-wmv', 'video/x-flv', 'application/octet-stream'
    ];
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.webm', '.m4v', '.mkv', '.mpeg', '.mpg', '.3gp', '.wmv', '.flv'];

    const ext = path.extname(file.originalname).toLowerCase();
    const isValidType = allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext);

    if (isValidType) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: MP4, MOV, AVI, WebM, MKV, M4V, MPEG'));
    }
  }
});

// Upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hour
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS || '50'),
  message: {
    error: 'Too many uploads, please try again later'
  }
});

// Get presigned URL for video upload
router.post(
  '/video/presign',
  authenticate as RequestHandler,
  uploadLimiter,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required'),
    body('contentType').notEmpty().withMessage('Content type required'),
    body('fileSize').isInt({ min: 1, max: 524288000 }).withMessage('File size must be 1 byte to 500MB')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        s3Key: key,
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
  authenticate as RequestHandler,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.body;

      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new NotFoundError('Video not found');
      }
      if (video.userId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      if (!video.s3Key) {
        throw new BadRequestError('No upload key found');
      }

      // Update status and queue processing
      await video.update({ status: VideoStatus.PROCESSING });

      // Add to processing queue
      await videoQueue.add('process', {
        videoId: video.id,
        userId: req.userId,
        key: video.s3Key
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
  authenticate as RequestHandler,
  validate([
    body('contentType').isIn(['image/jpeg', 'image/png', 'image/webp']).withMessage('Invalid image type'),
    body('fileSize').isInt({ min: 1, max: 5242880 }).withMessage('File size must be 1 byte to 5MB')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  authenticate as RequestHandler,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required'),
    body('contentType').isIn(['image/jpeg', 'image/png', 'image/webp']).withMessage('Invalid image type'),
    body('fileSize').isInt({ min: 1, max: 2097152 }).withMessage('File size must be 1 byte to 2MB')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  authenticate as RequestHandler,
  validate([
    body('videoId').isUUID().withMessage('Valid video ID required'),
    body('key').notEmpty().withMessage('Key required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

// ===========================================
// Direct Upload (for development without S3)
// ===========================================

// Direct video upload - stores files locally
router.post(
  '/video/direct',
  authenticate as RequestHandler,
  uploadLimiter,
  upload.single('video'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.body;

      if (!req.file) {
        throw new BadRequestError('No video file uploaded');
      }

      if (!videoId) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        throw new BadRequestError('Video ID required');
      }

      // Verify video exists and belongs to user
      const video = await Video.findByPk(videoId);
      if (!video) {
        fs.unlinkSync(req.file.path);
        throw new NotFoundError('Video not found');
      }
      if (video.userId !== req.userId) {
        fs.unlinkSync(req.file.path);
        throw new ForbiddenError('Not authorized');
      }

      // Move file to video-specific directory
      const videoDir = path.join(VIDEOS_DIR, req.userId!, videoId);
      if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

      const ext = path.extname(req.file.originalname);
      const originalPath = path.join(videoDir, `original${ext}`);
      const transcodedPath = path.join(videoDir, 'video.mp4');
      fs.renameSync(req.file.path, originalPath);

      // Set status to processing while we transcode
      await video.update({
        status: VideoStatus.PROCESSING,
        originalFilename: req.file.originalname,
        fileSize: req.file.size
      });

      logger.info(`Transcoding video ${videoId} to web-compatible format...`);

      try {
        // Get video duration
        const duration = await getVideoDuration(originalPath);

        // Transcode to web-compatible MP4
        await transcodeToWebMP4(originalPath, transcodedPath);

        // Generate a local URL for the transcoded video
        const localKey = `videos/${req.userId}/${videoId}/video.mp4`;
        const videoUrl = `/uploads/${localKey}`;

        // Update video record with transcoded file
        await video.update({
          s3Key: localKey,
          status: VideoStatus.READY,
          hlsUrl: videoUrl,
          duration
        });

        // Clean up original file to save space
        try {
          fs.unlinkSync(originalPath);
        } catch (e) {
          logger.warn(`Failed to delete original file: ${e}`);
        }

        logger.info(`Video ${videoId} transcoded and ready`);
      } catch (transcodeError: any) {
        logger.error(`Transcoding failed for video ${videoId}:`, transcodeError);

        // Fallback: use original file if transcoding fails
        const localKey = `videos/${req.userId}/${videoId}/original${ext}`;
        const videoUrl = `/uploads/${localKey}`;

        await video.update({
          s3Key: localKey,
          status: VideoStatus.READY,
          hlsUrl: videoUrl
        });

        logger.warn(`Using original file for video ${videoId} (transcoding failed)`);
      }

      // Clear trending cache so new videos appear immediately
      await cacheDelete('trending:12');
      await cacheDelete('trending:20');

      res.json({
        message: 'Video uploaded successfully',
        video: {
          id: video.id,
          title: video.title,
          status: video.status,
          videoUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// Direct Profile Image Upload (for development without S3)
// ===========================================

// Configure multer for profile image uploads
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const authReq = req;
    const userDir = path.join(UPLOADS_DIR, 'profiles', authReq.userId || 'anonymous');
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar${ext}`);
  }
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, WebP'));
    }
  }
});

// Direct profile image upload - stores files locally and updates user profile
router.post(
  '/profile-image/direct',
  authenticate as RequestHandler,
  profileImageUpload.single('image'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file uploaded');
      }

      // Generate a local URL for the image
      const localKey = `profiles/${req.userId}/avatar${path.extname(req.file.originalname)}`;
      const imageUrl = `/uploads/${localKey}`;

      // Update user's avatarUrl directly
      const { User } = await import('../models');
      const user = await User.findByPk(req.userId);
      if (user) {
        await user.update({ avatarUrl: imageUrl });
      }

      logger.info(`Profile image uploaded for user ${req.userId}`);

      res.json({
        message: 'Profile image uploaded successfully',
        imageUrl,
        avatarUrl: imageUrl,
        key: localKey
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// Direct Category Image Upload (for admin use)
// ===========================================

// Configure multer for category image uploads
const categoryImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const categoryDir = path.join(UPLOADS_DIR, 'categories');
    if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir, { recursive: true });
    cb(null, categoryDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const categoryImageUpload = multer({
  storage: categoryImageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, WebP, GIF'));
    }
  }
});

// Direct category image upload - stores files locally
router.post(
  '/category-image/direct',
  authenticate as RequestHandler,
  categoryImageUpload.single('image'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file uploaded');
      }

      // Generate a local URL for the image
      const localKey = `categories/${req.file.filename}`;
      const imageUrl = `/uploads/${localKey}`;

      logger.info(`Category image uploaded: ${imageUrl}`);

      res.json({
        message: 'Category image uploaded successfully',
        url: imageUrl,
        key: localKey
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
