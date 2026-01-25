import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

interface MarketingCampaignAttributes {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  startDate: Date | null;
  endDate: Date | null;
  targetAudience: string | null;
  goals: string | null;
  budget: number | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MarketingCampaignCreationAttributes extends Optional<MarketingCampaignAttributes, 'id' | 'description' | 'status' | 'startDate' | 'endDate' | 'targetAudience' | 'goals' | 'budget' | 'createdAt' | 'updatedAt'> {}

class MarketingCampaign extends Model<MarketingCampaignAttributes, MarketingCampaignCreationAttributes> implements MarketingCampaignAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare status: CampaignStatus;
  declare startDate: Date | null;
  declare endDate: Date | null;
  declare targetAudience: string | null;
  declare goals: string | null;
  declare budget: number | null;
  declare createdBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MarketingCampaign.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: CampaignStatus.DRAFT,
      validate: {
        isIn: [Object.values(CampaignStatus)]
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date'
    },
    targetAudience: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'target_audience'
    },
    goals: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: { model: 'users', key: 'id' }
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
    tableName: 'marketing_campaigns',
    modelName: 'MarketingCampaign',
    timestamps: true,
    indexes: [
      { fields: ['status'], name: 'mc_status_idx' },
      { fields: ['start_date', 'end_date'], name: 'mc_dates_idx' },
      { fields: ['created_by'], name: 'mc_created_by_idx' }
    ]
  }
);

export default MarketingCampaign;
