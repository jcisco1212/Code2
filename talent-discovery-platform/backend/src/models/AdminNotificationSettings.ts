import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AdminNotificationSettingsAttributes {
  id: string;
  userId: string; // Admin or Super Admin user
  // Industry notification settings
  industryPopupEnabled: boolean;
  industryPushEnabled: boolean;
  industrySmsEnabled: boolean;
  industryEmailEnabled: boolean;
  // Specific event type toggles
  agentSignupNotify: boolean;
  agentVerifiedNotify: boolean;
  promoterSignupNotify: boolean;
  managerSignupNotify: boolean;
  castingDirectorSignupNotify: boolean;
  producerSignupNotify: boolean;
  industryContactNotify: boolean;
  // Phone number for SMS
  smsPhoneNumber: string | null;
  smsVerified: boolean;
  // Notification schedule (e.g., don't notify between certain hours)
  quietHoursEnabled: boolean;
  quietHoursStart: string | null; // HH:mm format
  quietHoursEnd: string | null; // HH:mm format
  quietHoursTimezone: string | null;
  // Digest settings
  digestEnabled: boolean;
  digestFrequency: 'hourly' | 'daily' | 'weekly' | null;
  lastDigestSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminNotificationSettingsCreationAttributes extends Optional<AdminNotificationSettingsAttributes,
  'id' | 'industryPopupEnabled' | 'industryPushEnabled' | 'industrySmsEnabled' | 'industryEmailEnabled' |
  'agentSignupNotify' | 'agentVerifiedNotify' | 'promoterSignupNotify' | 'managerSignupNotify' |
  'castingDirectorSignupNotify' | 'producerSignupNotify' | 'industryContactNotify' |
  'smsPhoneNumber' | 'smsVerified' | 'quietHoursEnabled' | 'quietHoursStart' | 'quietHoursEnd' |
  'quietHoursTimezone' | 'digestEnabled' | 'digestFrequency' | 'lastDigestSentAt' |
  'createdAt' | 'updatedAt'
> {}

class AdminNotificationSettings extends Model<AdminNotificationSettingsAttributes, AdminNotificationSettingsCreationAttributes> implements AdminNotificationSettingsAttributes {
  declare id: string;
  declare userId: string;
  declare industryPopupEnabled: boolean;
  declare industryPushEnabled: boolean;
  declare industrySmsEnabled: boolean;
  declare industryEmailEnabled: boolean;
  declare agentSignupNotify: boolean;
  declare agentVerifiedNotify: boolean;
  declare promoterSignupNotify: boolean;
  declare managerSignupNotify: boolean;
  declare castingDirectorSignupNotify: boolean;
  declare producerSignupNotify: boolean;
  declare industryContactNotify: boolean;
  declare smsPhoneNumber: string | null;
  declare smsVerified: boolean;
  declare quietHoursEnabled: boolean;
  declare quietHoursStart: string | null;
  declare quietHoursEnd: string | null;
  declare quietHoursTimezone: string | null;
  declare digestEnabled: boolean;
  declare digestFrequency: 'hourly' | 'daily' | 'weekly' | null;
  declare lastDigestSentAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AdminNotificationSettings.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    industryPopupEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'industry_popup_enabled'
    },
    industryPushEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'industry_push_enabled'
    },
    industrySmsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'industry_sms_enabled'
    },
    industryEmailEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'industry_email_enabled'
    },
    agentSignupNotify: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'agent_signup_notify'
    },
    agentVerifiedNotify: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'agent_verified_notify'
    },
    promoterSignupNotify: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'promoter_signup_notify'
    },
    managerSignupNotify: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'manager_signup_notify'
    },
    castingDirectorSignupNotify: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'casting_director_signup_notify'
    },
    producerSignupNotify: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'producer_signup_notify'
    },
    industryContactNotify: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'industry_contact_notify'
    },
    smsPhoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'sms_phone_number'
    },
    smsVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sms_verified'
    },
    quietHoursEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'quiet_hours_enabled'
    },
    quietHoursStart: {
      type: DataTypes.STRING(5),
      allowNull: true,
      field: 'quiet_hours_start'
    },
    quietHoursEnd: {
      type: DataTypes.STRING(5),
      allowNull: true,
      field: 'quiet_hours_end'
    },
    quietHoursTimezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'quiet_hours_timezone'
    },
    digestEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'digest_enabled'
    },
    digestFrequency: {
      type: DataTypes.ENUM('hourly', 'daily', 'weekly'),
      allowNull: true,
      field: 'digest_frequency'
    },
    lastDigestSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_digest_sent_at'
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
    tableName: 'admin_notification_settings',
    modelName: 'AdminNotificationSettings',
    timestamps: true,
    indexes: [
      { fields: ['user_id'], unique: true }
    ]
  }
);

export default AdminNotificationSettings;
