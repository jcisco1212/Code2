import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum SocialPlatform {
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok'
}

export enum ContentStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  LINK = 'link',
  CAROUSEL = 'carousel'
}

interface SocialContentAttributes {
  id: string;
  title: string;
  content: string;
  platform: SocialPlatform;
  contentType: ContentType;
  status: ContentStatus;
  mediaUrls: string[] | null;
  linkUrl: string | null;
  hashtags: string[] | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  campaignId: string | null;
  createdBy: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SocialContentCreationAttributes extends Optional<SocialContentAttributes, 'id' | 'status' | 'mediaUrls' | 'linkUrl' | 'hashtags' | 'scheduledAt' | 'publishedAt' | 'campaignId' | 'notes' | 'createdAt' | 'updatedAt'> {}

class SocialContent extends Model<SocialContentAttributes, SocialContentCreationAttributes> implements SocialContentAttributes {
  declare id: string;
  declare title: string;
  declare content: string;
  declare platform: SocialPlatform;
  declare contentType: ContentType;
  declare status: ContentStatus;
  declare mediaUrls: string[] | null;
  declare linkUrl: string | null;
  declare hashtags: string[] | null;
  declare scheduledAt: Date | null;
  declare publishedAt: Date | null;
  declare campaignId: string | null;
  declare createdBy: string;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SocialContent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [Object.values(SocialPlatform)]
      }
    },
    contentType: {
      type: DataTypes.STRING(20),
      defaultValue: ContentType.TEXT,
      field: 'content_type',
      validate: {
        isIn: [Object.values(ContentType)]
      }
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: ContentStatus.DRAFT,
      validate: {
        isIn: [Object.values(ContentStatus)]
      }
    },
    mediaUrls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      field: 'media_urls'
    },
    linkUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'link_url'
    },
    hashtags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'campaign_id',
      references: { model: 'marketing_campaigns', key: 'id' }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: { model: 'users', key: 'id' }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'social_content',
    modelName: 'SocialContent',
    timestamps: true,
    indexes: [
      { fields: ['status'], name: 'sc_status_idx' },
      { fields: ['platform'], name: 'sc_platform_idx' },
      { fields: ['scheduled_at'], name: 'sc_scheduled_idx' },
      { fields: ['campaign_id'], name: 'sc_campaign_idx' },
      { fields: ['created_by'], name: 'sc_created_by_idx' }
    ]
  }
);

export default SocialContent;
