import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum WatchPartyStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ENDED = 'ended'
}

interface WatchPartyAttributes {
  id: string;
  hostId: string;
  videoId: string;
  title: string;
  description: string | null;
  inviteCode: string;
  status: WatchPartyStatus;
  currentTime: number;
  isPlaying: boolean;
  maxParticipants: number;
  isPrivate: boolean;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WatchPartyCreationAttributes extends Optional<WatchPartyAttributes,
  'id' | 'description' | 'status' | 'currentTime' | 'isPlaying' | 'maxParticipants' |
  'isPrivate' | 'scheduledAt' | 'startedAt' | 'endedAt' | 'createdAt' | 'updatedAt'
> {}

class WatchParty extends Model<WatchPartyAttributes, WatchPartyCreationAttributes> implements WatchPartyAttributes {
  declare id: string;
  declare hostId: string;
  declare videoId: string;
  declare title: string;
  declare description: string | null;
  declare inviteCode: string;
  declare status: WatchPartyStatus;
  declare currentTime: number;
  declare isPlaying: boolean;
  declare maxParticipants: number;
  declare isPrivate: boolean;
  declare scheduledAt: Date | null;
  declare startedAt: Date | null;
  declare endedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare host?: any;
  declare video?: any;
  declare participants?: any[];
}

WatchParty.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    hostId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'host_id',
      references: {
        model: 'users',
        key: 'id'
      }
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    inviteCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'invite_code'
    },
    status: {
      type: DataTypes.ENUM('waiting', 'playing', 'paused', 'ended'),
      defaultValue: 'waiting'
    },
    currentTime: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
      field: 'current_time'
    },
    isPlaying: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_playing'
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      field: 'max_participants'
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_private'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at'
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ended_at'
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
    tableName: 'watch_parties',
    modelName: 'WatchParty',
    indexes: [
      { fields: ['host_id'] },
      { fields: ['video_id'] },
      { fields: ['invite_code'], unique: true },
      { fields: ['status'] },
      { fields: ['scheduled_at'] }
    ]
  }
);

export default WatchParty;
