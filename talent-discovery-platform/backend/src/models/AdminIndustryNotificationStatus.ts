import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum AdminNotificationStatus {
  PENDING = 'pending',
  VIEWED = 'viewed',
  DISMISSED = 'dismissed'
}

interface AdminIndustryNotificationStatusAttributes {
  id: string;
  adminId: string; // The admin who received/viewed the notification
  industryNotificationId: string;
  status: AdminNotificationStatus;
  viewedAt: Date | null;
  dismissedAt: Date | null;
  popupShown: boolean;
  popupShownAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminIndustryNotificationStatusCreationAttributes extends Optional<AdminIndustryNotificationStatusAttributes,
  'id' | 'status' | 'viewedAt' | 'dismissedAt' | 'popupShown' | 'popupShownAt' | 'createdAt' | 'updatedAt'
> {}

class AdminIndustryNotificationStatus extends Model<AdminIndustryNotificationStatusAttributes, AdminIndustryNotificationStatusCreationAttributes> implements AdminIndustryNotificationStatusAttributes {
  declare id: string;
  declare adminId: string;
  declare industryNotificationId: string;
  declare status: AdminNotificationStatus;
  declare viewedAt: Date | null;
  declare dismissedAt: Date | null;
  declare popupShown: boolean;
  declare popupShownAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AdminIndustryNotificationStatus.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'admin_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    industryNotificationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'industry_notification_id',
      references: {
        model: 'industry_notifications',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AdminNotificationStatus)),
      defaultValue: AdminNotificationStatus.PENDING
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
    popupShown: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'popup_shown'
    },
    popupShownAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'popup_shown_at'
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
    tableName: 'admin_industry_notification_status',
    modelName: 'AdminIndustryNotificationStatus',
    timestamps: true,
    indexes: [
      { fields: ['admin_id'] },
      { fields: ['industry_notification_id'] },
      { fields: ['status'] },
      { fields: ['admin_id', 'industry_notification_id'], unique: true }
    ]
  }
);

export default AdminIndustryNotificationStatus;
