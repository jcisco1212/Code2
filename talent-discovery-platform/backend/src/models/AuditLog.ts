import { Model, DataTypes, Sequelize } from 'sequelize';

export enum AuditAction {
  // User actions
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_BAN = 'user_ban',
  USER_UNBAN = 'user_unban',
  USER_VERIFY = 'user_verify',
  USER_ROLE_CHANGE = 'user_role_change',

  // Video actions
  VIDEO_CREATE = 'video_create',
  VIDEO_UPDATE = 'video_update',
  VIDEO_DELETE = 'video_delete',
  VIDEO_FLAG = 'video_flag',
  VIDEO_UNFLAG = 'video_unflag',

  // Admin actions
  CATEGORY_CREATE = 'category_create',
  CATEGORY_UPDATE = 'category_update',
  CATEGORY_DELETE = 'category_delete',
  ANNOUNCEMENT_CREATE = 'announcement_create',
  ANNOUNCEMENT_UPDATE = 'announcement_update',
  ANNOUNCEMENT_DELETE = 'announcement_delete',
  SETTINGS_UPDATE = 'settings_update',

  // Moderation
  COMMENT_DELETE = 'comment_delete',
  REPORT_RESOLVE = 'report_resolve',
  CONTENT_MODERATE = 'content_moderate'
}

interface AuditLogAttributes {
  id: string;
  userId: string | null;
  action: AuditAction;
  targetType: string;
  targetId: string | null;
  details: object | null;
  ipAddress: string | null;
  userAgent: string | null;
}

interface AuditLogCreationAttributes extends Omit<AuditLogAttributes, 'id'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: string;
  public userId!: string | null;
  public action!: AuditAction;
  public targetType!: string;
  public targetId!: string | null;
  public details!: object | null;
  public ipAddress!: string | null;
  public userAgent!: string | null;

  public readonly createdAt!: Date;
}

export const initAuditLog = (sequelize: Sequelize) => {
  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      targetType: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      targetId: {
        type: DataTypes.UUID,
        allowNull: true
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'audit_logs',
      updatedAt: false,
      indexes: [
        { fields: ['userId'] },
        { fields: ['action'] },
        { fields: ['targetType', 'targetId'] },
        { fields: ['createdAt'] }
      ]
    }
  );

  return AuditLog;
};

export default AuditLog;
