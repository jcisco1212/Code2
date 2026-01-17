import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum AnnouncementType {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error'
}

export enum AnnouncementTarget {
  ALL = 'all',
  CREATORS = 'creators',
  AGENTS = 'agents',
  ADMINS = 'admins'
}

interface AnnouncementAttributes {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  target: AnnouncementTarget;
  isActive: boolean;
  isPinned: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AnnouncementCreationAttributes extends Optional<AnnouncementAttributes, 'id' | 'isActive' | 'isPinned' | 'startsAt' | 'expiresAt' | 'createdAt' | 'updatedAt'> {}

class Announcement extends Model<AnnouncementAttributes, AnnouncementCreationAttributes> implements AnnouncementAttributes {
  declare id: string;
  declare title: string;
  declare content: string;
  declare type: AnnouncementType;
  declare target: AnnouncementTarget;
  declare isActive: boolean;
  declare isPinned: boolean;
  declare startsAt: Date | null;
  declare expiresAt: Date | null;
  declare createdBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Announcement.init(
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
    type: {
      type: DataTypes.STRING(20),
      defaultValue: AnnouncementType.INFO,
      validate: {
        isIn: [Object.values(AnnouncementType)]
      }
    },
    target: {
      type: DataTypes.STRING(20),
      defaultValue: AnnouncementTarget.ALL,
      validate: {
        isIn: [Object.values(AnnouncementTarget)]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pinned'
    },
    startsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'starts_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
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
    tableName: 'announcements',
    modelName: 'Announcement',
    timestamps: true,
    indexes: [
      { fields: ['is_active', 'target'], name: 'ann_active_target_idx' },
      { fields: ['is_pinned'], name: 'ann_pinned_idx' },
      { fields: ['expires_at'], name: 'ann_expires_idx' }
    ]
  }
);

export default Announcement;
