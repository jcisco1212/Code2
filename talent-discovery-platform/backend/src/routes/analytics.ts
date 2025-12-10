import { Router } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { Video, VideoStatus, VideoView, Like, LikeTarget, Follow, Comment } from '../models';
import { Op, fn, col } from 'sequelize';

const router = Router();

// Get creator dashboard analytics
router.get(
  '/dashboard',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period = '30d' } = req.query;

      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[period as string] || 30;
      const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get user's videos
      const videos = await Video.findAll({
        where: { userId: req.userId, status: VideoStatus.READY },
        attributes: ['id', 'title', 'views', 'likes', 'commentCount', 'aiPerformanceScore', 'createdAt']
      });

      const videoIds = videos.map(v => v.id);

      // Total stats
      const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
      const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);
      const totalComments = videos.reduce((sum, v) => sum + v.commentCount, 0);
      const avgAIScore = videos.length > 0
        ? videos.reduce((sum, v) => sum + (v.aiPerformanceScore || 0), 0) / videos.length
        : 0;

      // Get view stats over time
      const viewsByDate = await VideoView.findAll({
        where: {
          videoId: { [Op.in]: videoIds },
          createdAt: { [Op.gte]: dateThreshold }
        },
        attributes: [
          [fn('DATE', col('created_at')), 'date'],
          [fn('COUNT', col('id')), 'views'],
          [fn('SUM', col('watch_time')), 'watchTime']
        ],
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']]
      });

      // Follower growth
      const followerGrowth = await Follow.findAll({
        where: {
          followingId: req.userId,
          createdAt: { [Op.gte]: dateThreshold }
        },
        attributes: [
          [fn('DATE', col('created_at')), 'date'],
          [fn('COUNT', col('id')), 'newFollowers']
        ],
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']]
      });

      // Total followers
      const totalFollowers = await Follow.count({
        where: { followingId: req.userId }
      });

      // Top performing videos
      const topVideos = [...videos]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      res.json({
        summary: {
          totalVideos: videos.length,
          totalViews,
          totalLikes,
          totalComments,
          totalFollowers,
          avgAIScore: Math.round(avgAIScore * 10) / 10
        },
        viewsByDate,
        followerGrowth,
        topVideos
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get engagement metrics
router.get(
  '/engagement',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period = '30d' } = req.query;

      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[period as string] || 30;
      const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get videos
      const videos = await Video.findAll({
        where: { userId: req.userId, status: VideoStatus.READY },
        attributes: ['id']
      });

      const videoIds = videos.map(v => v.id);

      // Likes over time
      const likesOverTime = await Like.findAll({
        where: {
          targetId: { [Op.in]: videoIds },
          targetType: LikeTarget.VIDEO,
          createdAt: { [Op.gte]: dateThreshold }
        },
        attributes: [
          [fn('DATE', col('created_at')), 'date'],
          [fn('COUNT', col('id')), 'likes']
        ],
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']]
      });

      // Comments over time
      const commentsOverTime = await Comment.findAll({
        where: {
          videoId: { [Op.in]: videoIds },
          createdAt: { [Op.gte]: dateThreshold }
        },
        attributes: [
          [fn('DATE', col('created_at')), 'date'],
          [fn('COUNT', col('id')), 'comments']
        ],
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']]
      });

      res.json({
        likesOverTime,
        commentsOverTime
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get audience insights
router.get(
  '/audience',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const videos = await Video.findAll({
        where: { userId: req.userId, status: VideoStatus.READY },
        attributes: ['id']
      });

      const videoIds = videos.map(v => v.id);

      // Geographic distribution
      const geoDistribution = await VideoView.findAll({
        where: { videoId: { [Op.in]: videoIds } },
        attributes: [
          'country',
          [fn('COUNT', col('id')), 'views']
        ],
        group: ['country'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 10
      });

      // Watch time distribution
      const watchTimeDistribution = await VideoView.findAll({
        where: { videoId: { [Op.in]: videoIds } },
        attributes: [
          [fn('AVG', col('completed_percent')), 'avgCompletion'],
          [fn('AVG', col('watch_time')), 'avgWatchTime']
        ]
      });

      res.json({
        geoDistribution,
        watchTimeStats: watchTimeDistribution[0] || { avgCompletion: 0, avgWatchTime: 0 }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get AI performance insights
router.get(
  '/ai-insights',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const videos = await Video.findAll({
        where: {
          userId: req.userId,
          status: VideoStatus.READY,
          aiPerformanceScore: { [Op.not]: null }
        },
        attributes: [
          'id',
          'title',
          'aiPerformanceScore',
          'aiVocalScore',
          'aiExpressionScore',
          'aiMovementScore',
          'aiTimingScore',
          'aiQualityScore',
          'aiCategoryTags',
          'createdAt'
        ],
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      // Calculate averages
      const avgScores = {
        overall: 0,
        vocal: 0,
        expression: 0,
        movement: 0,
        timing: 0,
        quality: 0
      };

      if (videos.length > 0) {
        videos.forEach(v => {
          avgScores.overall += v.aiPerformanceScore || 0;
          avgScores.vocal += v.aiVocalScore || 0;
          avgScores.expression += v.aiExpressionScore || 0;
          avgScores.movement += v.aiMovementScore || 0;
          avgScores.timing += v.aiTimingScore || 0;
          avgScores.quality += v.aiQualityScore || 0;
        });

        Object.keys(avgScores).forEach(key => {
          avgScores[key as keyof typeof avgScores] = Math.round((avgScores[key as keyof typeof avgScores] / videos.length) * 10) / 10;
        });
      }

      // Score trend over time
      const scoreTrend = videos.map(v => ({
        date: v.createdAt,
        score: v.aiPerformanceScore
      })).reverse();

      res.json({
        averageScores: avgScores,
        scoreTrend,
        recentVideos: videos.slice(0, 5)
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
