import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SavedVideoAttributes {
  id: string;
  userId: string;
  videoId: string;
  createdAt: Date;
}

interface SavedVideoCreationAttributes extends Optional<SavedVideoAttributes, 'id' | 'createdAt'> {}

class SavedVideo extends Model<SavedVideoAttributes, SavedVideoCreationAttributes> implements SavedVideoAttributes {
  declare id: string;
  declare userId: string;
  declare videoId: string;
  declare readonly createdAt: Date;
}

SavedVideo.init(
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
    videoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'video_id',
      references: {
        model: 'videos',
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
    tableName: 'saved_videos',
    modelName: 'SavedVideo',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['video_id'] },
      { fields: ['user_id', 'video_id'], unique: true }
    ]
  }
);

export default SavedVideo;
