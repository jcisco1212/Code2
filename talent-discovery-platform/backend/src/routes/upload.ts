import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import sharp from 'sharp';
import { Video, VideoStatus } from '../models';
import { generatePresignedPost, generateUploadUrl, buckets } from '../config/s3';
import { videoQueue } from '../jobs/videoQueue';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
import { cacheDelete } from '../config/redis';
import { execSync } from 'child_process';

const router = Router();

// Check if ffmpeg is available
let ffmpegAvailable = false;
let ffmpegPath = 'ffmpeg';
const possiblePaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg', 'ffmpeg'];

for (const testPath of possiblePaths) {
  try {
    execSync(`${testPath} -version`, { stdio: 'ignore' });
    ffmpegAvailable = true;
    ffmpegPath = testPath;
    logger.info(`FFmpeg found at ${testPath} - video transcoding enabled`);
    break;
  } catch {
    // Try next path
  }
}

if (!ffmpegAvailable) {
  logger.warn('FFmpeg not found - videos will be served without transcoding');
}

// Only import fluent-ffmpeg if ffmpeg is available
let ffmpeg: any = null;
if (ffmpegAvailable) {
  ffmpeg = require('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffmpegPath.replace('ffmpeg', 'ffprobe'));
}

// Transcode video to web-compatible MP4
function transcodeToWebMP4(inputPath: string, outputPath: string): Promise<void> {
  if (!ffmpeg) return Promise.reject(new Error('FFmpeg not available'));
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
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

// Get video duration using ffprobe
function getVideoDuration(filePath: string): Promise<number> {
  if (!ffmpeg) return Promise.resolve(0);
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(Math.floor(metadata.format.duration || 0));
    });
  });
}

// Generate thumbnail from video at specified time with high quality
function generateThumbnail(videoPath: string, outputPath: string, timeSeconds: number = 1): Promise<void> {
  if (!ffmpeg) return Promise.reject(new Error('FFmpeg not available'));
  return new Promise((resolve, reject) => {
    const tempPath = outputPath.replace('.jpg', '_temp.jpg');

    ffmpeg(videoPath)
      .on('end', async () => {
        try {
          // Post-process with sharp for better quality and proper sizing
          await sharp(tempPath)
            .resize(1280, 720, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 90, progressive: true })
            .toFile(outputPath);

          // Remove temp file
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          resolve();
        } catch (sharpError) {
          // If sharp fails, just rename the temp file
          if (fs.existsSync(tempPath)) {
            fs.renameSync(tempPath, outputPath);
          }
          resolve();
        }
      })
      .on('error', (err: Error) => reject(err))
      .screenshots({
        timestamps: [timeSeconds],
        filename: path.basename(tempPath),
        folder: path.dirname(tempPath),
        size: '1920x1080' // Capture at higher resolution for better quality
      });
  });
}

// Local uploads directory for development
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// Ensure upload directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

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

      // Set status to processing
      await video.update({
        status: VideoStatus.PROCESSING,
        originalFilename: req.file.originalname,
        fileSize: req.file.size
      });

      // Return response immediately - transcoding happens in background
      const localKey = `videos/${req.userId}/${videoId}/video.mp4`;
      const videoUrl = `/uploads/${localKey}`;

      res.json({
        message: 'Video uploaded successfully. Processing in background...',
        video: {
          id: video.id,
          title: video.title,
          status: VideoStatus.PROCESSING,
          videoUrl
        }
      });

      // Run transcoding in background (don't await)
      const userId = req.userId;
      (async () => {
        // If ffmpeg isn't available, just use the original file directly
        if (!ffmpegAvailable) {
          logger.info(`FFmpeg not available - using original file for video ${videoId}`);
          const originalKey = `videos/${userId}/${videoId}/original${ext}`;
          const originalUrl = `/uploads/${originalKey}`;

          await video.update({
            s3Key: originalKey,
            status: VideoStatus.READY,
            hlsUrl: originalUrl
          });

          // Clear trending cache
          await cacheDelete('trending:12');
          await cacheDelete('trending:20');
          return;
        }

        logger.info(`Transcoding video ${videoId} to web-compatible format...`);

        try {
          // Get video duration
          const duration = await getVideoDuration(originalPath);

          // Transcode to web-compatible MP4
          await transcodeToWebMP4(originalPath, transcodedPath);

          // Generate thumbnail from transcoded video
          let thumbnailUrl: string | null = null;
          try {
            const thumbnailDir = path.join(THUMBNAILS_DIR, userId!, videoId);
            if (!fs.existsSync(thumbnailDir)) fs.mkdirSync(thumbnailDir, { recursive: true });
            const thumbnailPath = path.join(thumbnailDir, 'thumbnail.jpg');

            // Extract frame at 1 second or 25% of video duration (whichever is greater)
            const thumbnailTime = Math.max(1, Math.floor((duration || 4) * 0.25));
            await generateThumbnail(transcodedPath, thumbnailPath, thumbnailTime);

            thumbnailUrl = `/uploads/thumbnails/${userId}/${videoId}/thumbnail.jpg`;
            logger.info(`Thumbnail generated for video ${videoId}`);
          } catch (thumbError) {
            logger.warn(`Failed to generate thumbnail for video ${videoId}:`, thumbError);
          }

          // Auto-detect if video is a clip (under 60 seconds)
          const isClip = duration > 0 && duration <= 60;

          // Update video record with transcoded file and thumbnail
          await video.update({
            s3Key: localKey,
            status: VideoStatus.READY,
            hlsUrl: videoUrl,
            duration,
            isClip,
            ...(thumbnailUrl && { thumbnailUrl })
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
          const fallbackKey = `videos/${userId}/${videoId}/original${ext}`;
          const fallbackUrl = `/uploads/${fallbackKey}`;

          // Try to get duration from original file
          let fallbackDuration = 0;
          try {
            fallbackDuration = await getVideoDuration(originalPath);
          } catch (durationError) {
            logger.warn(`Failed to get duration for video ${videoId}:`, durationError);
          }

          // Try to generate thumbnail from original file
          let thumbnailUrl: string | null = null;
          try {
            const thumbnailDir = path.join(THUMBNAILS_DIR, userId!, videoId);
            if (!fs.existsSync(thumbnailDir)) fs.mkdirSync(thumbnailDir, { recursive: true });
            const thumbnailPath = path.join(thumbnailDir, 'thumbnail.jpg');
            await generateThumbnail(originalPath, thumbnailPath, 1);
            thumbnailUrl = `/uploads/thumbnails/${userId}/${videoId}/thumbnail.jpg`;
            logger.info(`Thumbnail generated from original file for video ${videoId}`);
          } catch (thumbError) {
            logger.warn(`Failed to generate thumbnail for video ${videoId}:`, thumbError);
          }

          // Auto-detect if video is a clip (under 60 seconds)
          const fallbackIsClip = fallbackDuration > 0 && fallbackDuration <= 60;

          await video.update({
            s3Key: fallbackKey,
            status: VideoStatus.READY,
            hlsUrl: fallbackUrl,
            duration: fallbackDuration,
            isClip: fallbackIsClip,
            ...(thumbnailUrl && { thumbnailUrl })
          });

          logger.warn(`Using original file for video ${videoId} (transcoding failed)`);
        }

        // Clear trending cache so new videos appear
        await cacheDelete('trending:12');
        await cacheDelete('trending:20');
      })();
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
// Direct Thumbnail Upload (for development without S3)
// ===========================================

// Configure multer for thumbnail uploads
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const authReq = req;
    const thumbnailDir = path.join(UPLOADS_DIR, 'thumbnails', authReq.userId || 'anonymous');
    if (!fs.existsSync(thumbnailDir)) fs.mkdirSync(thumbnailDir, { recursive: true });
    cb(null, thumbnailDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.videoId || uuidv4()}${ext}`);
  }
});

const thumbnailUpload = multer({
  storage: thumbnailStorage,
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

// Direct thumbnail upload - stores files locally
router.post(
  '/thumbnail/direct',
  authenticate as RequestHandler,
  thumbnailUpload.single('thumbnail'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { videoId } = req.body;

      if (!req.file) {
        throw new BadRequestError('No thumbnail file uploaded');
      }

      if (!videoId) {
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

      // Generate a local URL for the thumbnail
      const localKey = `thumbnails/${req.userId}/${req.file.filename}`;
      const thumbnailUrl = `/uploads/${localKey}`;

      // Update video with custom thumbnail
      await video.update({
        thumbnailUrl,
        customThumbnailUrl: thumbnailUrl
      });

      logger.info(`Custom thumbnail uploaded for video ${videoId}`);

      res.json({
        message: 'Thumbnail uploaded successfully',
        thumbnailUrl,
        key: localKey
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// Direct Gallery Image Upload (for photo gallery)
// ===========================================

// Configure multer for gallery image uploads
const galleryImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const authReq = req;
    const userDir = path.join(UPLOADS_DIR, 'gallery', authReq.userId || 'anonymous');
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const galleryImageUpload = multer({
  storage: galleryImageStorage,
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

// Direct gallery image upload - stores files locally (does NOT update avatar)
router.post(
  '/gallery-image/direct',
  authenticate as RequestHandler,
  galleryImageUpload.single('image'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file uploaded');
      }

      // Generate a local URL for the image (unique filename)
      const localKey = `gallery/${req.userId}/${req.file.filename}`;
      const imageUrl = `/uploads/${localKey}`;

      logger.info(`Gallery image uploaded for user ${req.userId}: ${imageUrl}`);

      res.json({
        message: 'Gallery image uploaded successfully',
        url: imageUrl,
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

// Direct category image upload - stores files locally with automatic resize/crop
router.post(
  '/category-image/direct',
  authenticate as RequestHandler,
  categoryImageUpload.single('image'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file uploaded');
      }

      const originalPath = req.file.path;
      const ext = path.extname(req.file.filename);
      const baseName = path.basename(req.file.filename, ext);
      const optimizedFilename = `${baseName}_optimized.jpg`;
      const optimizedPath = path.join(path.dirname(originalPath), optimizedFilename);

      // Resize and crop image to fit category tile dimensions (400x240 for 5:3 aspect ratio)
      // Using 'cover' to fill the area while maintaining aspect ratio (crops excess)
      await sharp(originalPath)
        .resize(400, 240, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(optimizedPath);

      // Remove original file to save space
      fs.unlinkSync(originalPath);

      // Generate a local URL for the optimized image
      const localKey = `categories/${optimizedFilename}`;
      const imageUrl = `/uploads/${localKey}`;

      logger.info(`Category image uploaded and optimized: ${imageUrl}`);

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
