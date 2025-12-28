import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum EntryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WINNER = 'winner',
  RUNNER_UP = 'runner_up'
}

interface ChallengeEntryAttributes {
  id: string;
  challengeId: string;
  videoId: string;
  userId: string;
  status: EntryStatus;
  votesCount: number;
  rank: number | null;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ChallengeEntryCreationAttributes extends Optional<ChallengeEntryAttributes,
  'id' | 'status' | 'votesCount' | 'rank' | 'submittedAt' | 'createdAt' | 'updatedAt'
> {}

class ChallengeEntry extends Model<ChallengeEntryAttributes, ChallengeEntryCreationAttributes> implements ChallengeEntryAttributes {
  declare id: string;
  declare challengeId: string;
  declare videoId: string;
  declare userId: string;
  declare status: EntryStatus;
  declare votesCount: number;
  declare rank: number | null;
  declare submittedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChallengeEntry.init(
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
    videoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'video_id',
      references: {
        model: 'videos',
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
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'winner', 'runner_up'),
      defaultValue: 'approved'
    },
    votesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'votes_count'
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'submitted_at'
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
    tableName: 'challenge_entries',
    modelName: 'ChallengeEntry',
    indexes: [
      { fields: ['challenge_id'] },
      { fields: ['video_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['votes_count'] },
      { fields: ['challenge_id', 'user_id'], unique: true }
    ]
  }
);

export default ChallengeEntry;
