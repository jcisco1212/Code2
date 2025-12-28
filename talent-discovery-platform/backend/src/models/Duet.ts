import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum DuetLayout {
  SIDE_BY_SIDE = 'side_by_side',
  TOP_BOTTOM = 'top_bottom',
  PICTURE_IN_PICTURE = 'picture_in_picture',
  GREEN_SCREEN = 'green_screen'
}

export enum DuetStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  READY = 'ready'
}

interface DuetAttributes {
  id: string;
  originalVideoId: string;
  responseVideoId: string;
  creatorId: string;
  layout: DuetLayout;
  status: DuetStatus;
  combinedVideoUrl: string | null;
  combinedThumbnailUrl: string | null;
  audioMix: 'both' | 'original' | 'response';
  originalVolume: number;
  responseVolume: number;
  syncOffset: number;
  viewsCount: number;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DuetCreationAttributes extends Optional<DuetAttributes,
  'id' | 'status' | 'combinedVideoUrl' | 'combinedThumbnailUrl' | 'audioMix' |
  'originalVolume' | 'responseVolume' | 'syncOffset' | 'viewsCount' | 'likesCount' |
  'createdAt' | 'updatedAt'
> {}

class Duet extends Model<DuetAttributes, DuetCreationAttributes> implements DuetAttributes {
  declare id: string;
  declare originalVideoId: string;
  declare responseVideoId: string;
  declare creatorId: string;
  declare layout: DuetLayout;
  declare status: DuetStatus;
  declare combinedVideoUrl: string | null;
  declare combinedThumbnailUrl: string | null;
  declare audioMix: 'both' | 'original' | 'response';
  declare originalVolume: number;
  declare responseVolume: number;
  declare syncOffset: number;
  declare viewsCount: number;
  declare likesCount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations will be added
  declare originalVideo?: any;
  declare responseVideo?: any;
  declare creator?: any;
}

Duet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    originalVideoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'original_video_id',
      references: {
        model: 'videos',
        key: 'id'
      }
    },
    responseVideoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'response_video_id',
      references: {
        model: 'videos',
        key: 'id'
      }
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'creator_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    layout: {
      type: DataTypes.ENUM('side_by_side', 'top_bottom', 'picture_in_picture', 'green_screen'),
      defaultValue: 'side_by_side'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing', 'ready'),
      defaultValue: 'pending'
    },
    combinedVideoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'combined_video_url'
    },
    combinedThumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'combined_thumbnail_url'
    },
    audioMix: {
      type: DataTypes.ENUM('both', 'original', 'response'),
      defaultValue: 'both',
      field: 'audio_mix'
    },
    originalVolume: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: 'original_volume'
    },
    responseVolume: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: 'response_volume'
    },
    syncOffset: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sync_offset'
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
    tableName: 'duets',
    modelName: 'Duet',
    indexes: [
      { fields: ['original_video_id'] },
      { fields: ['response_video_id'] },
      { fields: ['creator_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ]
  }
);

export default Duet;
