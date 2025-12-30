import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AgentProfileViewAttributes {
  id: string;
  agentId: string;
  talentId: string;
  viewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentProfileViewCreationAttributes extends Optional<AgentProfileViewAttributes,
  'id' | 'viewedAt' | 'createdAt' | 'updatedAt'
> {}

class AgentProfileView extends Model<AgentProfileViewAttributes, AgentProfileViewCreationAttributes> implements AgentProfileViewAttributes {
  declare id: string;
  declare agentId: string;
  declare talentId: string;
  declare viewedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AgentProfileView.init(
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
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'viewed_at'
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
    tableName: 'agent_profile_views',
    modelName: 'AgentProfileView',
    indexes: [
      { fields: ['agent_id'] },
      { fields: ['talent_id'] },
      { fields: ['viewed_at'] },
      { fields: ['agent_id', 'talent_id'] }
    ]
  }
);

export default AgentProfileView;
