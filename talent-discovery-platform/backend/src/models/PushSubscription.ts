import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface PushSubscriptionAttributes {
  id: string;
  userId: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  userAgent: string | null;
  deviceName: string | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PushSubscriptionCreationAttributes extends Optional<PushSubscriptionAttributes,
  'id' | 'userAgent' | 'deviceName' | 'isActive' | 'lastUsedAt' | 'createdAt' | 'updatedAt'
> {}

class PushSubscription extends Model<PushSubscriptionAttributes, PushSubscriptionCreationAttributes> implements PushSubscriptionAttributes {
  declare id: string;
  declare userId: string;
  declare endpoint: string;
  declare p256dhKey: string;
  declare authKey: string;
  declare userAgent: string | null;
  declare deviceName: string | null;
  declare isActive: boolean;
  declare lastUsedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PushSubscription.init(
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
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    p256dhKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'p256dh_key'
    },
    authKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'auth_key'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'user_agent'
    },
    deviceName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'device_name'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_used_at'
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
    tableName: 'push_subscriptions',
    modelName: 'PushSubscription',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['endpoint'], unique: true },
      { fields: ['is_active'] }
    ]
  }
);

export default PushSubscription;
