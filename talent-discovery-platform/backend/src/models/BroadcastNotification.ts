import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum BroadcastType {
  ANNOUNCEMENT = 'announcement',
  SURVEY = 'survey',
  MAINTENANCE = 'maintenance',
  FEATURE_UPDATE = 'feature_update',
  PROMOTION = 'promotion',
  URGENT = 'urgent',
  SYSTEM_ALERT = 'system_alert'
}

export enum BroadcastTarget {
  ALL = 'all',
  USERS = 'users',
  CREATORS = 'creators',
  AGENTS = 'agents',
  ADMINS = 'admins',
  SUPER_ADMINS = 'super_admins',
  ENTERTAINMENT_PROFESSIONALS = 'entertainment_professionals'
}

export enum BroadcastPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum BroadcastStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

interface BroadcastNotificationAttributes {
  id: string;
  type: BroadcastType;
  title: string;
  message: string;
  actionUrl: string | null;
  actionText: string | null;
  imageUrl: string | null;
  targets: BroadcastTarget[];
  priority: BroadcastPriority;
  status: BroadcastStatus;
  showPopup: boolean;
  sendPush: boolean;
  sendEmail: boolean;
  sendSms: boolean;
  dismissible: boolean;
  requireAcknowledge: boolean;
  surveyData: Record<string, any> | null;
  scheduledAt: Date | null;
  expiresAt: Date | null;
  createdBy: string;
  data: Record<string, any>;
  totalSent: number;
  totalViewed: number;
  totalDismissed: number;
  totalAcknowledged: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BroadcastNotificationCreationAttributes extends Optional<BroadcastNotificationAttributes,
  'id' | 'actionUrl' | 'actionText' | 'imageUrl' | 'priority' | 'status' | 'showPopup' | 'sendPush' |
  'sendEmail' | 'sendSms' | 'dismissible' | 'requireAcknowledge' | 'surveyData' | 'scheduledAt' |
  'expiresAt' | 'data' | 'totalSent' | 'totalViewed' | 'totalDismissed' | 'totalAcknowledged' |
  'createdAt' | 'updatedAt'
> {}

class BroadcastNotification extends Model<BroadcastNotificationAttributes, BroadcastNotificationCreationAttributes> implements BroadcastNotificationAttributes {
  declare id: string;
  declare type: BroadcastType;
  declare title: string;
  declare message: string;
  declare actionUrl: string | null;
  declare actionText: string | null;
  declare imageUrl: string | null;
  declare targets: BroadcastTarget[];
  declare priority: BroadcastPriority;
  declare status: BroadcastStatus;
  declare showPopup: boolean;
  declare sendPush: boolean;
  declare sendEmail: boolean;
  declare sendSms: boolean;
  declare dismissible: boolean;
  declare requireAcknowledge: boolean;
  declare surveyData: Record<string, any> | null;
  declare scheduledAt: Date | null;
  declare expiresAt: Date | null;
  declare createdBy: string;
  declare data: Record<string, any>;
  declare totalSent: number;
  declare totalViewed: number;
  declare totalDismissed: number;
  declare totalAcknowledged: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BroadcastNotification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM(...Object.values(BroadcastType)),
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
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'action_url'
    },
    actionText: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'action_text'
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url'
    },
    targets: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [BroadcastTarget.ALL]
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(BroadcastPriority)),
      defaultValue: BroadcastPriority.NORMAL
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BroadcastStatus)),
      defaultValue: BroadcastStatus.DRAFT
    },
    showPopup: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'show_popup'
    },
    sendPush: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'send_push'
    },
    sendEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'send_email'
    },
    sendSms: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'send_sms'
    },
    dismissible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    requireAcknowledge: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'require_acknowledge'
    },
    surveyData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'survey_data'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at'
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
      references: {
        model: 'users',
        key: 'id'
      }
    },
    data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    totalSent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_sent'
    },
    totalViewed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_viewed'
    },
    totalDismissed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_dismissed'
    },
    totalAcknowledged: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_acknowledged'
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
    tableName: 'broadcast_notifications',
    modelName: 'BroadcastNotification',
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['created_by'] },
      { fields: ['scheduled_at'] },
      { fields: ['expires_at'] },
      { fields: ['created_at'] }
    ]
  }
);

export default BroadcastNotification;
