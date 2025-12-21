import { Model, DataTypes, Sequelize } from 'sequelize';

interface TalentNoteAttributes {
  id: string;
  agentId: string;
  talentId: string;
  content: string;
  isPinned: boolean;
}

interface TalentNoteCreationAttributes extends Omit<TalentNoteAttributes, 'id' | 'isPinned'> {}

class TalentNote extends Model<TalentNoteAttributes, TalentNoteCreationAttributes> implements TalentNoteAttributes {
  public id!: string;
  public agentId!: string;
  public talentId!: string;
  public content!: string;
  public isPinned!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initTalentNote = (sequelize: Sequelize) => {
  TalentNote.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      agentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      talentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      tableName: 'talent_notes',
      indexes: [
        { fields: ['agentId', 'talentId'] },
        { fields: ['agentId', 'isPinned'] }
      ]
    }
  );

  return TalentNote;
};

export default TalentNote;
