import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum VideoStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SCANNING = 'scanning',
  TRANSCODING = 'transcoding',
  READY = 'ready',
  FAILED = 'failed',
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
  title: string;
  description: string | null;
  categoryId: string | null;
  subcategory: string | null;
  tags: string[];
  status: VideoStatus;
  visibility: VideoVisibility;
  originalKey: string;
  hlsKey: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  mimeType: string | null;
  views: number;
  likes: number;
  dislikes: number;
  commentCount: number;
  shareCount: number;
  watchTimeTotal: number;
  watchTimeAverage: number;
  engagementScore: number;
  aiPerformanceScore: number | null;
  aiVocalScore: number | null;
  aiExpressionScore: number | null;
  aiMovementScore: number | null;
  aiTimingScore: number | null;
  aiQualityScore: number | null;
  aiCategoryTags: string[];
  aiAnalysisStatus: string | null;
  aiAnalysisError: string | null;
  commentsEnabled: boolean;
  ageRestricted: boolean;
  moderationStatus: string;
  moderationNotes: string | null;
  featuredAt: Date | null;
  trendingScore: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface VideoCreationAttributes extends Optional<VideoAttributes,
  'id' | 'description' | 'categoryId' | 'subcategory' | 'tags' | 'status' | 'visibility' |
  'hlsKey' | 'thumbnailUrl' | 'duration' | 'width' | 'height' | 'fileSize' |
  'mimeType' | 'views' | 'likes' | 'dislikes' | 'commentCount' | 'shareCount' |
  'watchTimeTotal' | 'watchTimeAverage' | 'engagementScore' | 'aiPerformanceScore' |
  'aiVocalScore' | 'aiExpressionScore' | 'aiMovementScore' | 'aiTimingScore' |
  'aiQualityScore' | 'aiCategoryTags' | 'aiAnalysisStatus' | 'aiAnalysisError' |
  'commentsEnabled' | 'ageRestricted' | 'moderationStatus' | 'moderationNotes' |
  'featuredAt' | 'trendingScore' | 'publishedAt' | 'createdAt' | 'updatedAt'
> {}

class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  public id!: string;
  public userId!: string;
  public title!: string;
  public description!: string | null;
  public categoryId!: string | null;
  public subcategory!: string | null;
  public tags!: string[];
  public status!: VideoStatus;
  public visibility!: VideoVisibility;
  public originalKey!: string;
  public hlsKey!: string | null;
  public thumbnailUrl!: string | null;
  public duration!: number | null;
  public width!: number | null;
  public height!: number | null;
  public fileSize!: number | null;
  public mimeType!: string | null;
  public views!: number;
  public likes!: number;
  public dislikes!: number;
  public commentCount!: number;
  public shareCount!: number;
  public watchTimeTotal!: number;
  public watchTimeAverage!: number;
  public engagementScore!: number;
  public aiPerformanceScore!: number | null;
  public aiVocalScore!: number | null;
  public aiExpressionScore!: number | null;
  public aiMovementScore!: number | null;
  public aiTimingScore!: number | null;
  public aiQualityScore!: number | null;
  public aiCategoryTags!: string[];
  public aiAnalysisStatus!: string | null;
  public aiAnalysisError!: string | null;
  public commentsEnabled!: boolean;
  public ageRestricted!: boolean;
  public moderationStatus!: string;
  public moderationNotes!: string | null;
  public featuredAt!: Date | null;
  public trendingScore!: number;
  public publishedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Calculate discover-me ranking score
  public calculateRankingScore(): number {
    const weights = {
      views: 0.15,
      watchTime: 0.20,
      likes: 0.15,
      comments: 0.10,
      aiScore: 0.20,
      engagementVelocity: 0.10,
      consistency: 0.05,
      quality: 0.05
    };

    let score = 0;
    score += Math.log10(this.views + 1) * weights.views * 10;
    score += Math.log10(this.watchTimeTotal + 1) * weights.watchTime * 5;
    score += Math.log10(this.likes + 1) * weights.likes * 10;
    score += Math.log10(this.commentCount + 1) * weights.comments * 10;
    score += (this.aiPerformanceScore || 0) * weights.aiScore;
    score += this.engagementScore * weights.engagementVelocity;
    score += (this.aiQualityScore || 0) * weights.quality;

    return Math.round(score * 100) / 100;
  }

  public toPublicJSON(): Partial<VideoAttributes> & { rankingScore: number } {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      categoryId: this.categoryId,
      subcategory: this.subcategory,
      tags: this.tags,
      visibility: this.visibility,
      thumbnailUrl: this.thumbnailUrl,
      duration: this.duration,
      views: this.views,
      likes: this.likes,
      commentCount: this.commentCount,
      watchTimeAverage: this.watchTimeAverage,
      engagementScore: this.engagementScore,
      aiPerformanceScore: this.aiPerformanceScore,
      aiCategoryTags: this.aiCategoryTags,
      commentsEnabled: this.commentsEnabled,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
      rankingScore: this.calculateRankingScore()
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM(...Object.values(VideoStatus)),
      defaultValue: VideoStatus.PENDING
    },
    visibility: {
      type: DataTypes.ENUM(...Object.values(VideoVisibility)),
      defaultValue: VideoVisibility.PUBLIC
    },
    originalKey: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'original_key'
    },
    hlsKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'hls_key'
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
    width: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'file_size'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mime_type'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dislikes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    commentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'comment_count'
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'share_count'
    },
    watchTimeTotal: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      field: 'watch_time_total'
    },
    watchTimeAverage: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'watch_time_average'
    },
    engagementScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'engagement_score'
    },
    aiPerformanceScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'ai_performance_score'
    },
    aiVocalScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'ai_vocal_score'
    },
    aiExpressionScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'ai_expression_score'
    },
    aiMovementScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'ai_movement_score'
    },
    aiTimingScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'ai_timing_score'
    },
    aiQualityScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'ai_quality_score'
    },
    aiCategoryTags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      field: 'ai_category_tags'
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
    commentsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'comments_enabled'
    },
    ageRestricted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'age_restricted'
    },
    moderationStatus: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
      field: 'moderation_status'
    },
    moderationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'moderation_notes'
    },
    featuredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'featured_at'
    },
    trendingScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'trending_score'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
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
      { fields: ['views'] },
      { fields: ['likes'] },
      { fields: ['trending_score'] },
      { fields: ['ai_performance_score'] },
      { fields: ['published_at'] },
      { fields: ['created_at'] },
      { fields: ['tags'], using: 'GIN' },
      { fields: ['ai_category_tags'], using: 'GIN' },
      {
        name: 'videos_search_idx',
        fields: ['title'],
        using: 'GIN',
        operator: 'gin_trgm_ops'
      }
    ]
  }
);

export default Video;
