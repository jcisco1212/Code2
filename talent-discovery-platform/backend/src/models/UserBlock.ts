import { Model, DataTypes, Sequelize } from 'sequelize';

interface UserBlockAttributes {
  id: string;
  blockerId: string;
  blockedId: string;
  type: 'block' | 'mute';
  reason: string | null;
}

interface UserBlockCreationAttributes extends Omit<UserBlockAttributes, 'id'> {}

class UserBlock extends Model<UserBlockAttributes, UserBlockCreationAttributes> implements UserBlockAttributes {
  public id!: string;
  public blockerId!: string;
  public blockedId!: string;
  public type!: 'block' | 'mute';
  public reason!: string | null;

  public readonly createdAt!: Date;
}

export const initUserBlock = (sequelize: Sequelize) => {
  UserBlock.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      blockerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      blockedId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      type: {
        type: DataTypes.ENUM('block', 'mute'),
        allowNull: false,
        defaultValue: 'block'
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'user_blocks',
      updatedAt: false,
      indexes: [
        { fields: ['blockerId', 'blockedId', 'type'], unique: true },
        { fields: ['blockedId'] },
        { fields: ['type'] }
      ]
    }
  );

  return UserBlock;
};

export default UserBlock;
