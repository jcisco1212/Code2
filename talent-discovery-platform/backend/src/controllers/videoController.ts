import { Response, NextFunction } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Video, VideoStatus, VideoVisibility, User, Category, VideoView, Like, LikeTarget } from '../models';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler';
import { generateDownloadUrl } from '../config/s3';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis';
import { videoQueue } from '../jobs/videoQueue';
import { logger } from '../utils/logger';

// Get videos with pagination and filters
export const getVideos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      userId,
      sortBy = 'createdAt',
      order = 'DESC',
      visibility
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {
      status: VideoStatus.READY
    };

    // Only show public videos unless user owns them
    if (visibility) {
      where.visibility = visibility;
    } else if (req.userId) {
      where[Op.or] = [
        { visibility: VideoVisibility.PUBLIC },
        { userId: req.userId }
      ];
    } else {
      where.visibility = VideoVisibility.PUBLIC;
    }

    if (category) {
      where.categoryId = category;
    }

    if (userId) {
      where.userId = userId;
    }

    const validSortFields = ['createdAt', 'views', 'likes', 'trendingScore', 'aiPerformanceScore'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';

    const { count, rows } = await Video.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [[sortField as string, order as string]],
      limit: Number(limit),
      offset
    });

    res.json({
      videos: rows.map(v => v.toPublicJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single video
export const getVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl', 'bio'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!video) {
      throw new NotFoundError('Video not found');
    }

    // Check visibility
    if (video.visibility === VideoVisibility.PRIVATE && video.userId !== req.userId) {
      throw new NotFoundError('Video not found');
    }

    // Check if user liked the video
    let userLiked = null;
    if (req.userId) {
      const like = await Like.findOne({
        where: {
          userId: req.userId,
          targetId: id,
          targetType: LikeTarget.VIDEO
        }
      });
      userLiked = like ? like.type : null;
    }

    res.json({
      video: {
        ...video.toPublicJSON(),
        user: (video as any).user,
        category: (video as any).category
      },
      userLiked
    });
  } catch (error) {
    next(error);
  }
};

// Get video stream URL
export const getStreamUrl = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findByPk(id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    if (video.status !== VideoStatus.READY) {
      throw new BadRequestError('Video not available for streaming');
    }

    // Check visibility
    if (video.visibility === VideoVisibility.PRIVATE && video.userId !== req.userId) {
      throw new ForbiddenError('Access denied');
    }

    // Generate signed URL for HLS manifest
    const hlsKey = video.hlsKey || video.s3Key || video.originalKey;
    if (!hlsKey) {
      throw new NotFoundError('Video file not available');
    }
    const streamUrl = await generateDownloadUrl(hlsKey, 3600);

    res.json({ streamUrl });
  } catch (error) {
    next(error);
  }
};

// Create video metadata
export const createVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, categoryId, tags, visibility, commentsEnabled, scheduledAt, isClip } = req.body;

    // Validate scheduledAt if provided
    let parsedScheduledAt = null;
    if (scheduledAt) {
      parsedScheduledAt = new Date(scheduledAt);
      if (isNaN(parsedScheduledAt.getTime())) {
        throw new BadRequestError('Invalid scheduled date');
      }
      if (parsedScheduledAt <= new Date()) {
        throw new BadRequestError('Scheduled date must be in the future');
      }
    }

    const video = await Video.create({
      userId: req.userId!,
      title,
      description,
      ...(categoryId && { categoryId }),
      tags: tags || [],
      visibility: visibility || VideoVisibility.PUBLIC,
      commentsEnabled: commentsEnabled !== false,
      scheduledAt: parsedScheduledAt,
      isClip: isClip === true,
      originalKey: '', // Will be updated after upload
      status: VideoStatus.PENDING
    });

    res.status(201).json({ video: video.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

// Update video
export const updateVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, tags, visibility, commentsEnabled, duration, scheduledAt, isClip } = req.body;

    const video = await Video.findByPk(id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    if (video.userId !== req.userId) {
      throw new ForbiddenError('Not authorized to update this video');
    }

    // Validate scheduledAt if provided
    let parsedScheduledAt = undefined;
    if (scheduledAt !== undefined) {
      if (scheduledAt === null) {
        parsedScheduledAt = null; // Allow clearing scheduled time
      } else {
        parsedScheduledAt = new Date(scheduledAt);
        if (isNaN(parsedScheduledAt.getTime())) {
          throw new BadRequestError('Invalid scheduled date');
        }
        if (parsedScheduledAt <= new Date()) {
          throw new BadRequestError('Scheduled date must be in the future');
        }
      }
    }

    await video.update({
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(categoryId && { categoryId }),
      ...(tags && { tags }),
      ...(visibility && { visibility }),
      ...(commentsEnabled !== undefined && { commentsEnabled }),
      ...(duration !== undefined && { duration }),
      ...(parsedScheduledAt !== undefined && { scheduledAt: parsedScheduledAt }),
      ...(isClip !== undefined && { isClip })
    });

    // Clear cache
    await cacheDelete(`video:${id}`);

    res.json({ video: video.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

// Delete video
export const deleteVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findByPk(id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    if (video.userId !== req.userId) {
      throw new ForbiddenError('Not authorized to delete this video');
    }

    // Mark as removed (soft delete)
    await video.update({ status: VideoStatus.REMOVED });

    // Queue cleanup job
    await videoQueue.add('cleanup', { videoId: id });

    // Clear cache
    await cacheDelete(`video:${id}`);

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Record view
export const recordView = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { watchTime, sessionId } = req.body;

    const video = await Video.findByPk(id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    // Check for existing view in same session
    const existingView = await VideoView.findOne({
      where: {
        videoId: id,
        sessionId
      }
    });

    if (existingView) {
      // Update watch time
      if (watchTime) {
        existingView.watchTime = Math.max(existingView.watchTime, watchTime);
        existingView.completedPercent = video.duration ? (existingView.watchTime / video.duration) * 100 : 0;
        await existingView.save();
      }
    } else {
      // Create new view
      await VideoView.create({
        videoId: id,
        userId: req.userId || null,
        sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        watchTime: watchTime || 0,
        completedPercent: 0
      });

      // Increment view count
      await video.increment('viewsCount');
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Get trending videos
export const getTrendingVideos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 20 } = req.query;

    // Try cache first
    const cacheKey = `trending:${limit}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.json({ videos: cached });
      return;
    }

    const videos = await Video.findAll({
      where: {
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['trendingScore', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit)
    });

    const result = videos.map(v => ({
      ...v.toPublicJSON(),
      user: (v as any).user,
      category: (v as any).category
    }));

    // Cache for 5 minutes
    await cacheSet(cacheKey, result, 300);

    res.json({ videos: result });
  } catch (error) {
    next(error);
  }
};

// Get featured videos
export const getFeaturedVideos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const videos = await Video.findAll({
      where: {
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC,
        featuredAt: { [Op.not]: null }
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['featuredAt', 'DESC']],
      limit: Number(limit)
    });

    res.json({
      videos: videos.map(v => ({
        ...v.toPublicJSON(),
        user: (v as any).user,
        category: (v as any).category
      }))
    });
  } catch (error) {
    next(error);
  }
};

// Get videos by category
export const getVideosByCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'DESC' } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Video.findAndCountAll({
      where: {
        categoryId,
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [[sortBy as string, order as string]],
      limit: Number(limit),
      offset
    });

    res.json({
      videos: rows.map(v => ({ ...v.toPublicJSON(), user: (v as any).user, category: (v as any).category })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search videos
export const searchVideos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, page = 1, limit = 20, category, sortBy = 'relevance' } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const searchTerm = (q as string).toLowerCase();

    const where: any = {
      status: VideoStatus.READY,
      visibility: VideoVisibility.PUBLIC,
      [Op.or]: [
        { title: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } },
        { tags: { [Op.contains]: [searchTerm] } }
      ]
    };

    if (category) {
      where.categoryId = category;
    }

    let orderClause: any[] = [['createdAt', 'DESC']];
    if (sortBy === 'views') {
      orderClause = [['views', 'DESC']];
    } else if (sortBy === 'likes') {
      orderClause = [['likes', 'DESC']];
    } else if (sortBy === 'trending') {
      orderClause = [['trendingScore', 'DESC']];
    }

    const { count, rows } = await Video.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: orderClause,
      limit: Number(limit),
      offset
    });

    res.json({
      videos: rows.map(v => ({
        ...v.toPublicJSON(),
        user: (v as any).user,
        category: (v as any).category
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get video analytics
export const getVideoAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findByPk(id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    if (video.userId !== req.userId) {
      throw new ForbiddenError('Not authorized to view analytics');
    }

    // Get view statistics
    const viewStats = await VideoView.findAll({
      where: { videoId: id },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'views'],
        [fn('AVG', col('watch_time')), 'avgWatchTime']
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      limit: 30
    });

    // Get geographic distribution
    const geoStats = await VideoView.findAll({
      where: { videoId: id },
      attributes: [
        'country',
        [fn('COUNT', col('id')), 'views']
      ],
      group: ['country'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      video: video.toPublicJSON(),
      analytics: {
        totalViews: video.views,
        totalLikes: video.likes,
        totalComments: video.commentCount,
        avgWatchTime: video.watchTimeAverage,
        totalWatchTime: video.watchTimeTotal,
        engagementScore: video.engagementScore,
        viewsByDate: viewStats,
        viewsByCountry: geoStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get AI analysis
export const getAIAnalysis = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findByPk(id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    if (video.userId !== req.userId) {
      throw new ForbiddenError('Not authorized to view AI analysis');
    }

    res.json({
      analysis: {
        status: video.aiAnalysisStatus,
        error: video.aiAnalysisError,
        scores: {
          overall: video.aiPerformanceScore,
          vocal: video.aiVocalScore,
          expression: video.aiExpressionScore,
          movement: video.aiMovementScore,
          timing: video.aiTimingScore,
          quality: video.aiQualityScore
        },
        categories: video.aiCategoryTags
      }
    });
  } catch (error) {
    next(error);
  }
};

// Request AI reanalysis
export const requestReanalysis = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findByPk(id);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    if (video.userId !== req.userId) {
      throw new ForbiddenError('Not authorized');
    }

    // Queue AI analysis job
    await videoQueue.add('aiAnalysis', { videoId: id }, { priority: 2 });

    await video.update({ aiAnalysisStatus: 'pending' });

    res.json({ message: 'AI reanalysis queued' });
  } catch (error) {
    next(error);
  }
};

export default {
  getVideos,
  getVideo,
  getStreamUrl,
  createVideo,
  updateVideo,
  deleteVideo,
  recordView,
  getTrendingVideos,
  getFeaturedVideos,
  getVideosByCategory,
  searchVideos,
  getVideoAnalytics,
  getAIAnalysis,
  requestReanalysis
};
