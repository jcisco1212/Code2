import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ChallengeVoteAttributes {
  id: string;
  challengeId: string;
  entryId: string;
  userId: string;
  createdAt: Date;
}

interface ChallengeVoteCreationAttributes extends Optional<ChallengeVoteAttributes,
  'id' | 'createdAt'
> {}

class ChallengeVote extends Model<ChallengeVoteAttributes, ChallengeVoteCreationAttributes> implements ChallengeVoteAttributes {
  declare id: string;
  declare challengeId: string;
  declare entryId: string;
  declare userId: string;
  declare readonly createdAt: Date;
}

ChallengeVote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    challengeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'challenge_id',
      references: {
        model: 'challenges',
        key: 'id'
      }
    },
    entryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'entry_id',
      references: {
        model: 'challenge_entries',
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
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    }
  },
  {
    sequelize,
    tableName: 'challenge_votes',
    modelName: 'ChallengeVote',
    updatedAt: false,
    indexes: [
      { fields: ['challenge_id'] },
      { fields: ['entry_id'] },
      { fields: ['user_id'] },
      { fields: ['challenge_id', 'user_id'], unique: true }
    ]
  }
);

export default ChallengeVote;
