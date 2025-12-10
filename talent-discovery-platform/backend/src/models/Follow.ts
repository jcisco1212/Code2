import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface FollowAttributes {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

interface FollowCreationAttributes extends Optional<FollowAttributes, 'id' | 'createdAt'> {}

class Follow extends Model<FollowAttributes, FollowCreationAttributes> implements FollowAttributes {
  public id!: string;
  public followerId!: string;
  public followingId!: string;
  public readonly createdAt!: Date;
}

Follow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    followerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'follower_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    followingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'following_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    }
  },
  {
    sequelize,
    tableName: 'follows',
    modelName: 'Follow',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['follower_id'] },
      { fields: ['following_id'] },
      { fields: ['follower_id', 'following_id'], unique: true }
    ]
  }
);

export default Follow;
