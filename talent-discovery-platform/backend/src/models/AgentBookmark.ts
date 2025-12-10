import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AgentBookmarkAttributes {
  id: string;
  agentId: string;
  talentId: string;
  listName: string | null;
  notes: string | null;
  rating: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentBookmarkCreationAttributes extends Optional<AgentBookmarkAttributes,
  'id' | 'listName' | 'notes' | 'rating' | 'createdAt' | 'updatedAt'
> {}

class AgentBookmark extends Model<AgentBookmarkAttributes, AgentBookmarkCreationAttributes> implements AgentBookmarkAttributes {
  public id!: string;
  public agentId!: string;
  public talentId!: string;
  public listName!: string | null;
  public notes!: string | null;
  public rating!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AgentBookmark.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'agent_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    talentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'talent_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    listName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'list_name'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
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
    tableName: 'agent_bookmarks',
    modelName: 'AgentBookmark',
    indexes: [
      { fields: ['agent_id'] },
      { fields: ['talent_id'] },
      { fields: ['list_name'] },
      { fields: ['agent_id', 'talent_id'], unique: true }
    ]
  }
);

export default AgentBookmark;
