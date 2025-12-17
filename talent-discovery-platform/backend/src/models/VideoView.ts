import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface VideoViewAttributes {
  id: string;
  videoId: string;
  userId: string | null;
  sessionId: string;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  watchTime: number;
  completedPercent: number;
  source: string | null;
  createdAt: Date;
}

interface VideoViewCreationAttributes extends Optional<VideoViewAttributes,
  'id' | 'userId' | 'ipAddress' | 'userAgent' | 'country' | 'city' |
  'watchTime' | 'completedPercent' | 'source' | 'createdAt'
> {}

class VideoView extends Model<VideoViewAttributes, VideoViewCreationAttributes> implements VideoViewAttributes {
  declare id: string;
  declare videoId: string;
  declare userId: string | null;
  declare sessionId: string;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare country: string | null;
  declare city: string | null;
  declare watchTime: number;
  declare completedPercent: number;
  declare source: string | null;
  declare readonly createdAt: Date;
}

VideoView.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    videoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'video_id',
      references: {
        model: 'videos',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'session_id'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    watchTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'watch_time'
    },
    completedPercent: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'completed_percent'
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    }
  },
  {
    sequelize,
    tableName: 'video_views',
    modelName: 'VideoView',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['video_id'] },
      { fields: ['user_id'] },
      { fields: ['session_id'] },
      { fields: ['created_at'] },
      { fields: ['country'] }
    ]
  }
);

export default VideoView;
