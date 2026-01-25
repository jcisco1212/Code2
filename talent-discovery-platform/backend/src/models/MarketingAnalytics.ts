import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { SocialPlatform } from './SocialContent';

export enum MetricType {
  IMPRESSIONS = 'impressions',
  REACH = 'reach',
  CLICKS = 'clicks',
  LIKES = 'likes',
  SHARES = 'shares',
  COMMENTS = 'comments',
  FOLLOWERS = 'followers',
  ENGAGEMENT_RATE = 'engagement_rate',
  CLICK_THROUGH_RATE = 'click_through_rate',
  CONVERSIONS = 'conversions'
}

interface MarketingAnalyticsAttributes {
  id: string;
  contentId: string | null;
  campaignId: string | null;
  platform: SocialPlatform;
  metricType: MetricType;
  metricValue: number;
  recordedAt: Date;
  metadata: object | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MarketingAnalyticsCreationAttributes extends Optional<MarketingAnalyticsAttributes, 'id' | 'contentId' | 'campaignId' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class MarketingAnalytics extends Model<MarketingAnalyticsAttributes, MarketingAnalyticsCreationAttributes> implements MarketingAnalyticsAttributes {
  declare id: string;
  declare contentId: string | null;
  declare campaignId: string | null;
  declare platform: SocialPlatform;
  declare metricType: MetricType;
  declare metricValue: number;
  declare recordedAt: Date;
  declare metadata: object | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MarketingAnalytics.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'content_id',
      references: { model: 'social_content', key: 'id' }
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'campaign_id',
      references: { model: 'marketing_campaigns', key: 'id' }
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [Object.values(SocialPlatform)]
      }
    },
    metricType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'metric_type',
      validate: {
        isIn: [Object.values(MetricType)]
      }
    },
    metricValue: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      field: 'metric_value'
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'recorded_at'
    },
    metadata: {
      type: DataTypes.JSONB,
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
    tableName: 'marketing_analytics',
    modelName: 'MarketingAnalytics',
    timestamps: true,
    indexes: [
      { fields: ['content_id'], name: 'ma_content_idx' },
      { fields: ['campaign_id'], name: 'ma_campaign_idx' },
      { fields: ['platform'], name: 'ma_platform_idx' },
      { fields: ['metric_type'], name: 'ma_metric_type_idx' },
      { fields: ['recorded_at'], name: 'ma_recorded_at_idx' },
      { fields: ['platform', 'metric_type', 'recorded_at'], name: 'ma_platform_metric_date_idx' }
    ]
  }
);

export default MarketingAnalytics;
