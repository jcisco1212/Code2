import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum BroadcastUserStatus {
  PENDING = 'pending',
  VIEWED = 'viewed',
  DISMISSED = 'dismissed',
  ACKNOWLEDGED = 'acknowledged'
}

interface UserBroadcastStatusAttributes {
  id: string;
  userId: string;
  broadcastId: string;
  status: BroadcastUserStatus;
  viewedAt: Date | null;
  dismissedAt: Date | null;
  acknowledgedAt: Date | null;
  surveyResponse: Record<string, any> | null;
  pushSent: boolean;
  pushSentAt: Date | null;
  emailSent: boolean;
  emailSentAt: Date | null;
  smsSent: boolean;
  smsSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserBroadcastStatusCreationAttributes extends Optional<UserBroadcastStatusAttributes,
  'id' | 'status' | 'viewedAt' | 'dismissedAt' | 'acknowledgedAt' | 'surveyResponse' |
  'pushSent' | 'pushSentAt' | 'emailSent' | 'emailSentAt' | 'smsSent' | 'smsSentAt' |
  'createdAt' | 'updatedAt'
> {}

class UserBroadcastStatus extends Model<UserBroadcastStatusAttributes, UserBroadcastStatusCreationAttributes> implements UserBroadcastStatusAttributes {
  declare id: string;
  declare userId: string;
  declare broadcastId: string;
  declare status: BroadcastUserStatus;
  declare viewedAt: Date | null;
  declare dismissedAt: Date | null;
  declare acknowledgedAt: Date | null;
  declare surveyResponse: Record<string, any> | null;
  declare pushSent: boolean;
  declare pushSentAt: Date | null;
  declare emailSent: boolean;
  declare emailSentAt: Date | null;
  declare smsSent: boolean;
  declare smsSentAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserBroadcastStatus.init(
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
    broadcastId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'broadcast_id',
      references: {
        model: 'broadcast_notifications',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BroadcastUserStatus)),
      defaultValue: BroadcastUserStatus.PENDING
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'viewed_at'
    },
    dismissedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'dismissed_at'
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'acknowledged_at'
    },
    surveyResponse: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'survey_response'
    },
    pushSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'push_sent'
    },
    pushSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'push_sent_at'
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_sent'
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_sent_at'
    },
    smsSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sms_sent'
    },
    smsSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sms_sent_at'
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
    tableName: 'user_broadcast_status',
    modelName: 'UserBroadcastStatus',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['broadcast_id'] },
      { fields: ['status'] },
      { fields: ['user_id', 'broadcast_id'], unique: true }
    ]
  }
);

export default UserBroadcastStatus;
