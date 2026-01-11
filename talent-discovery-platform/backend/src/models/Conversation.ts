import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ConversationAttributes {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes,
  'id' | 'lastMessageAt' | 'lastMessagePreview' | 'createdAt' | 'updatedAt'
> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  declare id: string;
  declare participant1Id: string;
  declare participant2Id: string;
  declare lastMessageAt: Date | null;
  declare lastMessagePreview: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    participant1Id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'participant1_id',
      references: { model: 'users', key: 'id' }
    },
    participant2Id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'participant2_id',
      references: { model: 'users', key: 'id' }
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_message_at'
    },
    lastMessagePreview: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'last_message_preview'
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
    tableName: 'conversations',
    modelName: 'Conversation',
    indexes: [
      { fields: ['participant1_id', 'participant2_id'], unique: true },
      { fields: ['participant1_id', 'last_message_at'] },
      { fields: ['participant2_id', 'last_message_at'] }
    ]
  }
);

export default Conversation;
