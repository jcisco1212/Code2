import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum VideoStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SCANNING = 'scanning',
  TRANSCODING = 'transcoding',
  READY = 'ready',
  FAILED = 'failed',
  DELETED = 'deleted',
  REMOVED = 'removed'
}

export enum VideoVisibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private'
}

interface VideoAttributes {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  originalFilename: string | null;
  originalKey: string | null;
  s3Key: string | null;
  hlsKey: string | null;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  status: VideoStatus;
  visibility: VideoVisibility;
  viewsCount: number;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  sharesCount: number;
  aiOverallScore: number | null;
  aiVocalScore: number | null;
  aiMovementScore: number | null;
  aiExpressionScore: number | null;
  aiTimingScore: number | null;
  aiPresenceScore: number | null;
  aiPerformanceScore: number | null;
  aiQualityScore: number | null;
  aiAnalysisStatus: string | null;
  aiAnalysisError: string | null;
  aiCategoryTags: string[] | null;
  discoverScore: number;
  trendingScore: number;
  engagementScore: number;
  watchTimeTotal: number;
  watchTimeAverage: number;
  tags: string[];
  isFeatured: boolean;
  featuredAt: Date | null;
  commentsEnabled: boolean;
  moderationStatus: string | null;
  moderationNotes: string | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  customThumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface VideoCreationAttributes extends Optional<VideoAttributes,
  'id' | 'categoryId' | 'description' | 'originalFilename' | 'originalKey' | 's3Key' |
  'hlsKey' | 'hlsUrl' | 'thumbnailUrl' | 'duration' | 'fileSize' | 'width' | 'height' |
  'status' | 'visibility' | 'viewsCount' | 'likesCount' | 'dislikesCount' | 'commentsCount' |
  'sharesCount' | 'aiOverallScore' | 'aiVocalScore' | 'aiMovementScore' | 'aiExpressionScore' |
  'aiTimingScore' | 'aiPresenceScore' | 'aiPerformanceScore' | 'aiQualityScore' |
  'aiAnalysisStatus' | 'aiAnalysisError' | 'aiCategoryTags' | 'discoverScore' | 'trendingScore' |
  'engagementScore' | 'watchTimeTotal' | 'watchTimeAverage' | 'tags' | 'isFeatured' |
  'featuredAt' | 'commentsEnabled' | 'moderationStatus' | 'moderationNotes' | 'publishedAt' |
  'scheduledAt' | 'customThumbnailUrl' | 'createdAt' | 'updatedAt'
> {}

class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  declare id: string;
  declare userId: string;
  declare categoryId: string | null;
  declare title: string;
  declare description: string | null;
  declare originalFilename: string | null;
  declare originalKey: string | null;
  declare s3Key: string | null;
  declare hlsKey: string | null;
  declare hlsUrl: string | null;
  declare thumbnailUrl: string | null;
  declare duration: number | null;
  declare fileSize: number | null;
  declare width: number | null;
  declare height: number | null;
  declare status: VideoStatus;
  declare visibility: VideoVisibility;
  declare viewsCount: number;
  declare likesCount: number;
  declare dislikesCount: number;
  declare commentsCount: number;
  declare sharesCount: number;
  declare aiOverallScore: number | null;
  declare aiVocalScore: number | null;
  declare aiMovementScore: number | null;
  declare aiExpressionScore: number | null;
  declare aiTimingScore: number | null;
  declare aiPresenceScore: number | null;
  declare aiPerformanceScore: number | null;
  declare aiQualityScore: number | null;
  declare aiAnalysisStatus: string | null;
  declare aiAnalysisError: string | null;
  declare aiCategoryTags: string[] | null;
  declare discoverScore: number;
  declare trendingScore: number;
  declare engagementScore: number;
  declare watchTimeTotal: number;
  declare watchTimeAverage: number;
  declare tags: string[];
  declare isFeatured: boolean;
  declare featuredAt: Date | null;
  declare commentsEnabled: boolean;
  declare moderationStatus: string | null;
  declare moderationNotes: string | null;
  declare publishedAt: Date | null;
  declare scheduledAt: Date | null;
  declare customThumbnailUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Aliases for backward compatibility
  public get views(): number { return this.viewsCount; }
  public get likes(): number { return this.likesCount; }
  public get dislikes(): number { return this.dislikesCount; }
  public get commentCount(): number { return this.commentsCount; }

  // Calculate discover-me ranking score
  public calculateRankingScore(): number {
    const weights = {
      views: 0.15,
      likes: 0.20,
      comments: 0.15,
      aiScore: 0.30,
      trending: 0.20
    };

    let score = 0;
    score += Math.log10(this.viewsCount + 1) * weights.views * 10;
    score += Math.log10(this.likesCount + 1) * weights.likes * 10;
    score += Math.log10(this.commentsCount + 1) * weights.comments * 10;
    score += (this.aiOverallScore || 0) * weights.aiScore;
    score += this.trendingScore * weights.trending;

    return Math.round(score * 100) / 100;
  }

  // Convert to public-safe JSON (excludes internal fields)
  public toPublicJSON() {
    return {
      id: this.id,
      userId: this.userId,
      categoryId: this.categoryId,
      title: this.title,
      description: this.description,
      thumbnailUrl: this.thumbnailUrl,
      hlsUrl: this.hlsUrl,
      duration: this.duration,
      status: this.status,
      visibility: this.visibility,
      viewsCount: this.viewsCount,
      likesCount: this.likesCount,
      commentsCount: this.commentsCount,
      sharesCount: this.sharesCount,
      aiOverallScore: this.aiOverallScore,
      aiVocalScore: this.aiVocalScore,
      aiMovementScore: this.aiMovementScore,
      aiExpressionScore: this.aiExpressionScore,
      aiTimingScore: this.aiTimingScore,
      aiPresenceScore: this.aiPresenceScore,
      aiPerformanceScore: this.aiPerformanceScore,
      tags: this.tags,
      isFeatured: this.isFeatured,
      commentsEnabled: this.commentsEnabled,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

Video.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    originalFilename: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'original_filename'
    },
    originalKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'original_key'
    },
    s3Key: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 's3_key'
    },
    hlsKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'hls_key'
    },
    hlsUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'hls_url'
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'thumbnail_url'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'file_size'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'scanning', 'transcoding', 'ready', 'failed', 'deleted', 'removed'),
      defaultValue: 'pending'
    },
    visibility: {
      type: DataTypes.ENUM('public', 'unlisted', 'private'),
      defaultValue: 'public'
    },
    viewsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'views_count'
    },
    likesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'likes_count'
    },
    dislikesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'dislikes_count'
    },
    commentsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'comments_count'
    },
    sharesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'shares_count'
    },
    aiOverallScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'ai_overall_score'
    },
    aiVocalScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'ai_vocal_score'
    },
    aiMovementScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'ai_movement_score'
    },
    aiExpressionScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'ai_expression_score'
    },
    aiTimingScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'ai_timing_score'
    },
    aiPresenceScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'ai_presence_score'
    },
    aiPerformanceScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'ai_performance_score'
    },
    aiQualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'ai_quality_score'
    },
    aiAnalysisStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ai_analysis_status'
    },
    aiAnalysisError: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ai_analysis_error'
    },
    aiCategoryTags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      field: 'ai_category_tags'
    },
    discoverScore: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'discover_score'
    },
    trendingScore: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'trending_score'
    },
    engagementScore: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'engagement_score'
    },
    watchTimeTotal: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'watch_time_total'
    },
    watchTimeAverage: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'watch_time_average'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured'
    },
    featuredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'featured_at'
    },
    commentsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'comments_enabled'
    },
    moderationStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'moderation_status'
    },
    moderationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'moderation_notes'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at'
    },
    customThumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'custom_thumbnail_url'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'videos',
    modelName: 'Video',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['category_id'] },
      { fields: ['status'] },
      { fields: ['visibility'] },
      { fields: ['discover_score'] },
      { fields: ['trending_score'] },
      { fields: ['created_at'] },
      { fields: ['scheduled_at'] },
      { fields: ['tags'], using: 'GIN' }
    ]
  }
);

export default Video;
