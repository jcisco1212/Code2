import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface WatchPartyParticipantAttributes {
  id: string;
  watchPartyId: string;
  userId: string;
  isActive: boolean;
  joinedAt: Date;
  leftAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WatchPartyParticipantCreationAttributes extends Optional<WatchPartyParticipantAttributes,
  'id' | 'isActive' | 'leftAt' | 'createdAt' | 'updatedAt'
> {}

class WatchPartyParticipant extends Model<WatchPartyParticipantAttributes, WatchPartyParticipantCreationAttributes> implements WatchPartyParticipantAttributes {
  declare id: string;
  declare watchPartyId: string;
  declare userId: string;
  declare isActive: boolean;
  declare joinedAt: Date;
  declare leftAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare user?: any;
  declare watchParty?: any;
}

WatchPartyParticipant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    watchPartyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'watch_party_id',
      references: {
        model: 'watch_parties',
        key: 'id'
      }
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at'
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'left_at'
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
    tableName: 'watch_party_participants',
    modelName: 'WatchPartyParticipant',
    indexes: [
      { fields: ['watch_party_id'] },
      { fields: ['user_id'] },
      { fields: ['watch_party_id', 'user_id'], unique: true },
      { fields: ['is_active'] }
    ]
  }
);

export default WatchPartyParticipant;
