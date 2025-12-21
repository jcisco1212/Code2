import { Model, DataTypes, Sequelize } from 'sequelize';

interface PlaylistVideoAttributes {
  id: string;
  playlistId: string;
  videoId: string;
  position: number;
  addedAt: Date;
}

interface PlaylistVideoCreationAttributes extends Omit<PlaylistVideoAttributes, 'id' | 'addedAt'> {}

class PlaylistVideo extends Model<PlaylistVideoAttributes, PlaylistVideoCreationAttributes> implements PlaylistVideoAttributes {
  public id!: string;
  public playlistId!: string;
  public videoId!: string;
  public position!: number;
  public addedAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initPlaylistVideo = (sequelize: Sequelize) => {
  PlaylistVideo.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      playlistId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'playlists', key: 'id' }
      },
      videoId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'videos', key: 'id' }
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      addedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'playlist_videos',
      indexes: [
        { fields: ['playlistId', 'videoId'], unique: true },
        { fields: ['playlistId', 'position'] }
      ]
    }
  );

  return PlaylistVideo;
};

export default PlaylistVideo;
