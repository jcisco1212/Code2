import { Model, DataTypes, Sequelize } from 'sequelize';

interface UserBlockAttributes {
  id: string;
  blockerId: string;
  blockedId: string;
  reason: string | null;
}

interface UserBlockCreationAttributes extends Omit<UserBlockAttributes, 'id' | 'reason'> {}

class UserBlock extends Model<UserBlockAttributes, UserBlockCreationAttributes> implements UserBlockAttributes {
  public id!: string;
  public blockerId!: string;
  public blockedId!: string;
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
        { fields: ['blockerId', 'blockedId'], unique: true },
        { fields: ['blockedId'] }
      ]
    }
  );

  return UserBlock;
};

export default UserBlock;
