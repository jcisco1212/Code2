import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserAchievementAttributes {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Date;
  progress: number;
  isDisplayed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserAchievementCreationAttributes extends Optional<UserAchievementAttributes,
  'id' | 'progress' | 'isDisplayed' | 'earnedAt' | 'createdAt' | 'updatedAt'
> {}

class UserAchievement extends Model<UserAchievementAttributes, UserAchievementCreationAttributes> implements UserAchievementAttributes {
  declare id: string;
  declare userId: string;
  declare achievementId: string;
  declare earnedAt: Date;
  declare progress: number;
  declare isDisplayed: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserAchievement.init(
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
    achievementId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'achievement_id',
      references: {
        model: 'achievements',
        key: 'id'
      }
    },
    earnedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'earned_at'
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isDisplayed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_displayed'
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
    tableName: 'user_achievements',
    modelName: 'UserAchievement',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['achievement_id'] },
      { fields: ['user_id', 'achievement_id'], unique: true },
      { fields: ['earned_at'] },
      { fields: ['is_displayed'] }
    ]
  }
);

export default UserAchievement;
