import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum AchievementCategory {
  UPLOADS = 'uploads',
  VIEWS = 'views',
  ENGAGEMENT = 'engagement',
  SOCIAL = 'social',
  SPECIAL = 'special'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

interface AchievementAttributes {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  requirement: number;
  requirementType: string;
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AchievementCreationAttributes extends Optional<AchievementAttributes,
  'id' | 'xpReward' | 'isActive' | 'createdAt' | 'updatedAt'
> {}

class Achievement extends Model<AchievementAttributes, AchievementCreationAttributes> implements AchievementAttributes {
  declare id: string;
  declare name: string;
  declare description: string;
  declare icon: string;
  declare category: AchievementCategory;
  declare rarity: AchievementRarity;
  declare requirement: number;
  declare requirementType: string;
  declare xpReward: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Achievement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('uploads', 'views', 'engagement', 'social', 'special'),
      allowNull: false
    },
    rarity: {
      type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary'),
      allowNull: false
    },
    requirement: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    requirementType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'requirement_type'
    },
    xpReward: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      field: 'xp_reward'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
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
    tableName: 'achievements',
    modelName: 'Achievement',
    indexes: [
      { fields: ['category'] },
      { fields: ['rarity'] },
      { fields: ['requirement_type'] },
      { fields: ['is_active'] }
    ]
  }
);

export default Achievement;
