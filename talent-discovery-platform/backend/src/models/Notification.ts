import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum NotificationType {
  NEW_FOLLOWER = 'new_follower',
  VIDEO_LIKE = 'video_like',
  VIDEO_COMMENT = 'video_comment',
  COMMENT_REPLY = 'comment_reply',
  COMMENT_LIKE = 'comment_like',
  VIDEO_PUBLISHED = 'video_published',
  VIDEO_FEATURED = 'video_featured',
  VIDEO_TRENDING = 'video_trending',
  AGENT_MESSAGE = 'agent_message',
  AGENT_BOOKMARK = 'agent_bookmark',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  MODERATION_ACTION = 'moderation_action'
}

interface NotificationAttributes {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes,
  'id' | 'data' | 'isRead' | 'readAt' | 'createdAt'
> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public userId!: string;
  public type!: NotificationType;
  public title!: string;
  public message!: string;
  public data!: Record<string, any>;
  public isRead!: boolean;
  public readAt!: Date | null;
  public readonly createdAt!: Date;
}

Notification.init(
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
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    }
  },
  {
    sequelize,
    tableName: 'notifications',
    modelName: 'Notification',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['type'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] }
    ]
  }
);

export default Notification;
