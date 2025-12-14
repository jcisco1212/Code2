import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum VideoStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  DELETED = 'deleted'
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
  s3Key: string | null;
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
  commentsCount: number;
  sharesCount: number;
  aiOverallScore: number | null;
  aiVocalScore: number | null;
  aiMovementScore: number | null;
  aiExpressionScore: number | null;
  aiTimingScore: number | null;
  aiPresenceScore: number | null;
  discoverScore: number;
  trendingScore: number;
  tags: string[];
  isFeatured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface VideoCreationAttributes extends Optional<VideoAttributes,
  'id' | 'categoryId' | 'description' | 'originalFilename' | 's3Key' | 'hlsUrl' |
  'thumbnailUrl' | 'duration' | 'fileSize' | 'width' | 'height' | 'status' |
  'visibility' | 'viewsCount' | 'likesCount' | 'commentsCount' | 'sharesCount' |
  'aiOverallScore' | 'aiVocalScore' | 'aiMovementScore' | 'aiExpressionScore' |
  'aiTimingScore' | 'aiPresenceScore' | 'discoverScore' | 'trendingScore' |
  'tags' | 'isFeatured' | 'publishedAt' | 'createdAt' | 'updatedAt'
> {}

class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  public id!: string;
  public userId!: string;
  public categoryId!: string | null;
  public title!: string;
  public description!: string | null;
  public originalFilename!: string | null;
  public s3Key!: string | null;
  public hlsUrl!: string | null;
  public thumbnailUrl!: string | null;
  public duration!: number | null;
  public fileSize!: number | null;
  public width!: number | null;
  public height!: number | null;
  public status!: VideoStatus;
  public visibility!: VideoVisibility;
  public viewsCount!: number;
  public likesCount!: number;
  public commentsCount!: number;
  public sharesCount!: number;
  public aiOverallScore!: number | null;
  public aiVocalScore!: number | null;
  public aiMovementScore!: number | null;
  public aiExpressionScore!: number | null;
  public aiTimingScore!: number | null;
  public aiPresenceScore!: number | null;
  public discoverScore!: number;
  public trendingScore!: number;
  public tags!: string[];
  public isFeatured!: boolean;
  public publishedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

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
      tags: this.tags,
      isFeatured: this.isFeatured,
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
    s3Key: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 's3_key'
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
      type: DataTypes.ENUM('pending', 'processing', 'ready', 'failed', 'deleted'),
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
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured'
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
      { fields: ['discover_score'] },
      { fields: ['trending_score'] },
      { fields: ['created_at'] },
      { fields: ['tags'], using: 'GIN' }
    ]
  }
);

export default Video;
