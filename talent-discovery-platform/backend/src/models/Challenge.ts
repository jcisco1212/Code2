import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum ChallengeStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  VOTING = 'voting',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface ChallengeAttributes {
  id: string;
  title: string;
  description: string;
  rules: string | null;
  categoryId: string | null;
  coverImageUrl: string | null;
  hashtag: string;
  prize: string | null;
  prizeAmount: number | null;
  status: ChallengeStatus;
  startDate: Date;
  endDate: Date;
  votingEndDate: Date | null;
  minDuration: number | null;
  maxDuration: number | null;
  maxEntries: number | null;
  entriesCount: number;
  createdBy: string;
  winnerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ChallengeCreationAttributes extends Optional<ChallengeAttributes,
  'id' | 'rules' | 'categoryId' | 'coverImageUrl' | 'prize' | 'prizeAmount' |
  'status' | 'votingEndDate' | 'minDuration' | 'maxDuration' | 'maxEntries' |
  'entriesCount' | 'winnerId' | 'createdAt' | 'updatedAt'
> {}

class Challenge extends Model<ChallengeAttributes, ChallengeCreationAttributes> implements ChallengeAttributes {
  declare id: string;
  declare title: string;
  declare description: string;
  declare rules: string | null;
  declare categoryId: string | null;
  declare coverImageUrl: string | null;
  declare hashtag: string;
  declare prize: string | null;
  declare prizeAmount: number | null;
  declare status: ChallengeStatus;
  declare startDate: Date;
  declare endDate: Date;
  declare votingEndDate: Date | null;
  declare minDuration: number | null;
  declare maxDuration: number | null;
  declare maxEntries: number | null;
  declare entriesCount: number;
  declare createdBy: string;
  declare winnerId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Computed properties
  get isActive(): boolean {
    const now = new Date();
    return this.status === ChallengeStatus.ACTIVE &&
           now >= this.startDate &&
           now <= this.endDate;
  }

  get isVoting(): boolean {
    const now = new Date();
    return this.status === ChallengeStatus.VOTING ||
           (this.votingEndDate && now > this.endDate && now <= this.votingEndDate);
  }

  get timeRemaining(): number {
    const now = new Date();
    if (this.status === ChallengeStatus.VOTING && this.votingEndDate) {
      return Math.max(0, this.votingEndDate.getTime() - now.getTime());
    }
    return Math.max(0, this.endDate.getTime() - now.getTime());
  }
}

Challenge.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    coverImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'cover_image_url'
    },
    hashtag: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    prize: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    prizeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'prize_amount'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'voting', 'completed', 'cancelled'),
      defaultValue: 'draft'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date'
    },
    votingEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'voting_end_date'
    },
    minDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'min_duration'
    },
    maxDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_duration'
    },
    maxEntries: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_entries'
    },
    entriesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'entries_count'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    winnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'winner_id',
      references: {
        model: 'users',
        key: 'id'
      }
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
    tableName: 'challenges',
    modelName: 'Challenge',
    indexes: [
      { fields: ['status'] },
      { fields: ['hashtag'], unique: true },
      { fields: ['start_date'] },
      { fields: ['end_date'] },
      { fields: ['category_id'] },
      { fields: ['created_by'] }
    ]
  }
);

export default Challenge;
