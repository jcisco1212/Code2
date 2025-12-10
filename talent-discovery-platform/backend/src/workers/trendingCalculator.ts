import { Op, fn, col, literal } from 'sequelize';
import { Video, VideoStatus, VideoVisibility, VideoView } from '../models';
import { logger } from '../utils/logger';

// Calculate trending scores for all videos
export async function calculateTrendingScores(): Promise<void> {
  try {
    logger.info('Starting trending score calculation');

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all active videos
    const videos = await Video.findAll({
      where: {
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC
      },
      attributes: ['id', 'views', 'likes', 'commentCount', 'watchTimeTotal', 'aiPerformanceScore', 'createdAt']
    });

    for (const video of videos) {
      // Get recent engagement
      const recentViews = await VideoView.count({
        where: {
          videoId: video.id,
          createdAt: { [Op.gte]: oneDayAgo }
        }
      });

      const weeklyViews = await VideoView.count({
        where: {
          videoId: video.id,
          createdAt: { [Op.gte]: oneWeekAgo }
        }
      });

      // Calculate velocity (how fast engagement is growing)
      const dailyVelocity = recentViews;
      const weeklyVelocity = weeklyViews / 7;

      // Calculate time decay factor (newer videos get boost)
      const ageInDays = (now.getTime() - new Date(video.createdAt).getTime()) / (24 * 60 * 60 * 1000);
      const decayFactor = Math.exp(-ageInDays / 30); // Decay over 30 days

      // Calculate trending score
      // Formula: (recent engagement * velocity * decay) + base metrics * AI score
      const baseScore = (
        Math.log10(video.views + 1) * 2 +
        Math.log10(video.likes + 1) * 3 +
        Math.log10(video.commentCount + 1) * 2 +
        (video.aiPerformanceScore || 50) * 0.1
      );

      const velocityBoost = (dailyVelocity * 2 + weeklyVelocity) * 0.5;

      const trendingScore = (baseScore + velocityBoost) * (1 + decayFactor);

      // Calculate engagement score (for Discover-Me ranking)
      const engagementScore = video.views > 0
        ? ((video.likes + video.commentCount * 2) / video.views) * 100
        : 0;

      // Update video
      await Video.update({
        trendingScore: Math.round(trendingScore * 100) / 100,
        engagementScore: Math.round(engagementScore * 100) / 100
      }, {
        where: { id: video.id }
      });
    }

    logger.info(`Trending scores calculated for ${videos.length} videos`);
  } catch (error) {
    logger.error('Error calculating trending scores:', error);
    throw error;
  }
}

export default {
  calculateTrendingScores
};
