import { Model, DataTypes, Sequelize } from 'sequelize';

interface CastingListAttributes {
  id: string;
  agentId: string;
  name: string;
  description: string | null;
  projectName: string | null;
  deadline: Date | null;
  talentCount: number;
}

interface CastingListCreationAttributes extends Omit<CastingListAttributes, 'id' | 'talentCount'> {}

class CastingList extends Model<CastingListAttributes, CastingListCreationAttributes> implements CastingListAttributes {
  public id!: string;
  public agentId!: string;
  public name!: string;
  public description!: string | null;
  public projectName!: string | null;
  public deadline!: Date | null;
  public talentCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initCastingList = (sequelize: Sequelize) => {
  CastingList.init(
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      projectName: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: true
      },
      talentCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      sequelize,
      tableName: 'casting_lists',
      indexes: [
        { fields: ['agentId'] },
        { fields: ['deadline'] }
      ]
    }
  );

  return CastingList;
};

export default CastingList;
