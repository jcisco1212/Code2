import { Model, DataTypes, Sequelize } from 'sequelize';

interface ConversationAttributes {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
}

interface ConversationCreationAttributes extends Omit<ConversationAttributes, 'id' | 'lastMessageAt' | 'lastMessagePreview'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: string;
  public participant1Id!: string;
  public participant2Id!: string;
  public lastMessageAt!: Date | null;
  public lastMessagePreview!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initConversation = (sequelize: Sequelize) => {
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
        references: { model: 'users', key: 'id' }
      },
      participant2Id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lastMessagePreview: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'conversations',
      indexes: [
        { fields: ['participant1Id', 'participant2Id'], unique: true },
        { fields: ['participant1Id', 'lastMessageAt'] },
        { fields: ['participant2Id', 'lastMessageAt'] }
      ]
    }
  );

  return Conversation;
};

export default Conversation;
