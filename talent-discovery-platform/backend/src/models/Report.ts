import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum ReportType {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  SEXUAL_CONTENT = 'sexual_content',
  COPYRIGHT = 'copyright',
  MISINFORMATION = 'misinformation',
  IMPERSONATION = 'impersonation',
  OTHER = 'other'
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum ReportTarget {
  VIDEO = 'video',
  COMMENT = 'comment',
  USER = 'user'
}

interface ReportAttributes {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: ReportTarget;
  type: ReportType;
  description: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReportCreationAttributes extends Optional<ReportAttributes,
  'id' | 'description' | 'status' | 'reviewedBy' | 'reviewedAt' | 'resolution' |
  'createdAt' | 'updatedAt'
> {}

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  declare id: string;
  declare reporterId: string;
  declare targetId: string;
  declare targetType: ReportTarget;
  declare type: ReportType;
  declare description: string | null;
  declare status: ReportStatus;
  declare reviewedBy: string | null;
  declare reviewedAt: Date | null;
  declare resolution: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Report.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'reporter_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'target_id'
    },
    targetType: {
      type: DataTypes.ENUM(...Object.values(ReportTarget)),
      allowNull: false,
      field: 'target_type'
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ReportType)),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ReportStatus)),
      defaultValue: ReportStatus.PENDING
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reviewed_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at'
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'reports',
    modelName: 'Report',
    indexes: [
      { fields: ['reporter_id'] },
      { fields: ['target_id', 'target_type'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['created_at'] }
    ]
  }
);

export default Report;
