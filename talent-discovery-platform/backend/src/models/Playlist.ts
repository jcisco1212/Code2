import { Model, DataTypes, Sequelize } from 'sequelize';

export enum PlaylistVisibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private'
}

interface PlaylistAttributes {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  visibility: PlaylistVisibility;
  thumbnailUrl: string | null;
  videoCount: number;
}

interface PlaylistCreationAttributes extends Omit<PlaylistAttributes, 'id' | 'videoCount'> {}

class Playlist extends Model<PlaylistAttributes, PlaylistCreationAttributes> implements PlaylistAttributes {
  public id!: string;
  public userId!: string;
  public title!: string;
  public description!: string | null;
  public visibility!: PlaylistVisibility;
  public thumbnailUrl!: string | null;
  public videoCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initPlaylist = (sequelize: Sequelize) => {
  Playlist.init(
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
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      visibility: {
        type: DataTypes.ENUM(...Object.values(PlaylistVisibility)),
        defaultValue: PlaylistVisibility.PUBLIC
      },
      thumbnailUrl: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      videoCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      sequelize,
      tableName: 'playlists',
      indexes: [
        { fields: ['userId'] },
        { fields: ['visibility'] }
      ]
    }
  );

  return Playlist;
};

export default Playlist;
