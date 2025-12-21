import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface WatchHistoryAttributes {
  id: string;
  userId: string;
  videoId: string;
  watchedAt: Date;
  watchDuration: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WatchHistoryCreationAttributes extends Optional<WatchHistoryAttributes, 'id' | 'watchedAt' | 'watchDuration' | 'completed' | 'createdAt' | 'updatedAt'> {}

class WatchHistory extends Model<WatchHistoryAttributes, WatchHistoryCreationAttributes> implements WatchHistoryAttributes {
  declare id: string;
  declare userId: string;
  declare videoId: string;
  declare watchedAt: Date;
  declare watchDuration: number;
  declare completed: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WatchHistory.init(
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
      references: { model: 'users', key: 'id' }
    },
    videoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'video_id',
      references: { model: 'videos', key: 'id' }
    },
    watchedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'watched_at'
    },
    watchDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'watch_duration'
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'watch_history',
    modelName: 'WatchHistory',
    indexes: [
      { fields: ['user_id', 'video_id'], unique: true },
      { fields: ['user_id', 'watched_at'] }
    ]
  }
);

export default WatchHistory;
