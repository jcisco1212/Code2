import { Model, DataTypes, Sequelize } from 'sequelize';

interface WatchLaterAttributes {
  id: string;
  userId: string;
  videoId: string;
  addedAt: Date;
}

interface WatchLaterCreationAttributes extends Omit<WatchLaterAttributes, 'id' | 'addedAt'> {}

class WatchLater extends Model<WatchLaterAttributes, WatchLaterCreationAttributes> implements WatchLaterAttributes {
  public id!: string;
  public userId!: string;
  public videoId!: string;
  public addedAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initWatchLater = (sequelize: Sequelize) => {
  WatchLater.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      videoId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'videos', key: 'id' }
      },
      addedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'watch_later',
      indexes: [
        { fields: ['userId', 'videoId'], unique: true },
        { fields: ['userId', 'addedAt'] }
      ]
    }
  );

  return WatchLater;
};

export default WatchLater;
