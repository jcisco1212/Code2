import axios from 'axios';
import { Video, Comment } from '../models';
import { logger } from '../utils/logger';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

interface AnalyzeVideoData {
  videoId: string;
}

interface AnalyzeCommentData {
  commentId: string;
}

interface VideoAnalysisResult {
  performanceScore: number;
  vocalScore: number | null;
  expressionScore: number | null;
  movementScore: number | null;
  timingScore: number | null;
  qualityScore: number;
  categoryTags: string[];
}

interface CommentAnalysisResult {
  sentimentScore: number;
  isTroll: boolean;
  trollConfidence: number;
}

// Analyze video using AI service
export async function analyzeVideo(data: AnalyzeVideoData): Promise<void> {
  const { videoId } = data;

  try {
    await Video.update(
      { aiAnalysisStatus: 'processing' },
      { where: { id: videoId } }
    );

    const video = await Video.findByPk(videoId);
    if (!video || !video.hlsKey) {
      throw new Error('Video not found or not processed');
    }

    // Call AI service for analysis
    let analysis: VideoAnalysisResult;

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/analyze/video`, {
        videoId,
        videoUrl: video.hlsKey,
        duration: video.duration,
        categoryId: video.categoryId
      }, {
        timeout: 300000 // 5 minutes timeout
      });

      analysis = response.data;
    } catch (aiError: any) {
      // If AI service is unavailable, generate mock scores for development
      if (process.env.NODE_ENV === 'development') {
        logger.warn('AI service unavailable, generating mock scores');
        analysis = {
          performanceScore: Math.random() * 30 + 70, // 70-100
          vocalScore: Math.random() * 30 + 70,
          expressionScore: Math.random() * 30 + 70,
          movementScore: Math.random() * 30 + 70,
          timingScore: Math.random() * 30 + 70,
          qualityScore: Math.random() * 30 + 70,
          categoryTags: ['singer', 'entertainer'] // Mock tags
        };
      } else {
        throw aiError;
      }
    }

    // Update video with analysis results
    await Video.update({
      aiAnalysisStatus: 'completed',
      aiPerformanceScore: Math.round(analysis.performanceScore * 10) / 10,
      aiVocalScore: analysis.vocalScore ? Math.round(analysis.vocalScore * 10) / 10 : null,
      aiExpressionScore: analysis.expressionScore ? Math.round(analysis.expressionScore * 10) / 10 : null,
      aiMovementScore: analysis.movementScore ? Math.round(analysis.movementScore * 10) / 10 : null,
      aiTimingScore: analysis.timingScore ? Math.round(analysis.timingScore * 10) / 10 : null,
      aiQualityScore: Math.round(analysis.qualityScore * 10) / 10,
      aiCategoryTags: analysis.categoryTags
    }, {
      where: { id: videoId }
    });

    logger.info(`AI analysis completed for video ${videoId}`);
  } catch (error: any) {
    logger.error(`AI analysis failed for video ${videoId}:`, error.message);

    await Video.update({
      aiAnalysisStatus: 'failed',
      aiAnalysisError: error.message
    }, {
      where: { id: videoId }
    });

    throw error;
  }
}

// Analyze comment sentiment and troll detection
export async function analyzeComment(data: AnalyzeCommentData): Promise<void> {
  const { commentId } = data;

  try {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    let analysis: CommentAnalysisResult;

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/analyze/comment`, {
        commentId,
        content: comment.content
      }, {
        timeout: 30000
      });

      analysis = response.data;
    } catch (aiError: any) {
      // Mock analysis for development
      if (process.env.NODE_ENV === 'development') {
        logger.warn('AI service unavailable, generating mock comment analysis');

        // Simple keyword-based mock analysis
        const content = comment.content.toLowerCase();
        const negativeWords = ['hate', 'stupid', 'ugly', 'terrible', 'worst'];
        const positiveWords = ['love', 'amazing', 'great', 'awesome', 'beautiful'];

        const negCount = negativeWords.filter(w => content.includes(w)).length;
        const posCount = positiveWords.filter(w => content.includes(w)).length;

        analysis = {
          sentimentScore: (posCount - negCount + 5) / 10, // Normalize to 0-1
          isTroll: negCount > 2,
          trollConfidence: Math.min(negCount * 0.3, 1)
        };
      } else {
        throw aiError;
      }
    }

    await Comment.update({
      sentimentScore: analysis.sentimentScore,
      isTroll: analysis.isTroll,
      trollConfidence: analysis.trollConfidence
    }, {
      where: { id: commentId }
    });

    // Auto-hide if high troll confidence
    if (analysis.isTroll && analysis.trollConfidence > 0.8) {
      await Comment.update(
        { status: 'flagged' },
        { where: { id: commentId } }
      );
      logger.info(`Comment ${commentId} auto-flagged as potential troll`);
    }

    logger.info(`Comment analysis completed for ${commentId}`);
  } catch (error: any) {
    logger.error(`Comment analysis failed for ${commentId}:`, error.message);
    // Don't throw - comment analysis failures shouldn't block
  }
}

export default {
  analyzeVideo,
  analyzeComment
};
