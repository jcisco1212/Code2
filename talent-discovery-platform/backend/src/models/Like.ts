import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum LikeType {
  LIKE = 'like',
  DISLIKE = 'dislike'
}

export enum LikeTarget {
  VIDEO = 'video',
  COMMENT = 'comment'
}

interface LikeAttributes {
  id: string;
  userId: string;
  targetId: string;
  targetType: LikeTarget;
  type: LikeType;
  createdAt: Date;
}

interface LikeCreationAttributes extends Optional<LikeAttributes, 'id' | 'createdAt'> {}

class Like extends Model<LikeAttributes, LikeCreationAttributes> implements LikeAttributes {
  declare id: string;
  declare userId: string;
  declare targetId: string;
  declare targetType: LikeTarget;
  declare type: LikeType;
  declare readonly createdAt: Date;
}

Like.init(
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
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'target_id'
    },
    targetType: {
      type: DataTypes.ENUM(...Object.values(LikeTarget)),
      allowNull: false,
      field: 'target_type'
    },
    type: {
      type: DataTypes.ENUM(...Object.values(LikeType)),
      allowNull: false,
      defaultValue: LikeType.LIKE
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    }
  },
  {
    sequelize,
    tableName: 'likes',
    modelName: 'Like',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['target_id', 'target_type'] },
      { fields: ['user_id', 'target_id', 'target_type'], unique: true }
    ]
  }
);

export default Like;
