import { Model, DataTypes, Sequelize } from 'sequelize';

export enum TalentStatus {
  CONSIDERING = 'considering',
  SHORTLISTED = 'shortlisted',
  CONTACTED = 'contacted',
  AUDITIONED = 'auditioned',
  SELECTED = 'selected',
  REJECTED = 'rejected'
}

interface CastingListTalentAttributes {
  id: string;
  castingListId: string;
  talentId: string;
  status: TalentStatus;
  notes: string | null;
  rating: number | null;
  addedAt: Date;
}

interface CastingListTalentCreationAttributes extends Omit<CastingListTalentAttributes, 'id' | 'addedAt'> {}

class CastingListTalent extends Model<CastingListTalentAttributes, CastingListTalentCreationAttributes> implements CastingListTalentAttributes {
  public id!: string;
  public castingListId!: string;
  public talentId!: string;
  public status!: TalentStatus;
  public notes!: string | null;
  public rating!: number | null;
  public addedAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initCastingListTalent = (sequelize: Sequelize) => {
  CastingListTalent.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      castingListId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'casting_lists', key: 'id' }
      },
      talentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      status: {
        type: DataTypes.ENUM(...Object.values(TalentStatus)),
        defaultValue: TalentStatus.CONSIDERING
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 5 }
      },
      addedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'casting_list_talents',
      indexes: [
        { fields: ['castingListId', 'talentId'], unique: true },
        { fields: ['castingListId', 'status'] }
      ]
    }
  );

  return CastingListTalent;
};

export default CastingListTalent;
