import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum IndustryEventType {
  AGENT_SIGNUP = 'agent_signup',
  AGENT_VERIFIED = 'agent_verified',
  PROMOTER_SIGNUP = 'promoter_signup',
  MANAGER_SIGNUP = 'manager_signup',
  CASTING_DIRECTOR_SIGNUP = 'casting_director_signup',
  PRODUCER_SIGNUP = 'producer_signup',
  INDUSTRY_CONTACT = 'industry_contact',
  AGENT_PROFILE_COMPLETE = 'agent_profile_complete',
  AGENT_FIRST_BOOKMARK = 'agent_first_bookmark',
  AGENT_MESSAGE_TALENT = 'agent_message_talent'
}

export enum IndustryNotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

interface IndustryNotificationAttributes {
  id: string;
  eventType: IndustryEventType;
  title: string;
  message: string;
  data: Record<string, any>;
  userId: string; // The industry professional who triggered the event
  popupSent: boolean;
  pushSent: boolean;
  smsSent: boolean;
  emailSent: boolean;
  status: IndustryNotificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface IndustryNotificationCreationAttributes extends Optional<IndustryNotificationAttributes,
  'id' | 'data' | 'popupSent' | 'pushSent' | 'smsSent' | 'emailSent' | 'status' | 'createdAt' | 'updatedAt'
> {}

class IndustryNotification extends Model<IndustryNotificationAttributes, IndustryNotificationCreationAttributes> implements IndustryNotificationAttributes {
  declare id: string;
  declare eventType: IndustryEventType;
  declare title: string;
  declare message: string;
  declare data: Record<string, any>;
  declare userId: string;
  declare popupSent: boolean;
  declare pushSent: boolean;
  declare smsSent: boolean;
  declare emailSent: boolean;
  declare status: IndustryNotificationStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

IndustryNotification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eventType: {
      type: DataTypes.ENUM(...Object.values(IndustryEventType)),
      allowNull: false,
      field: 'event_type'
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    popupSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'popup_sent'
    },
    pushSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'push_sent'
    },
    smsSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sms_sent'
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_sent'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(IndustryNotificationStatus)),
      defaultValue: IndustryNotificationStatus.PENDING
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
    tableName: 'industry_notifications',
    modelName: 'IndustryNotification',
    timestamps: true,
    indexes: [
      { fields: ['event_type'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ]
  }
);

export default IndustryNotification;
