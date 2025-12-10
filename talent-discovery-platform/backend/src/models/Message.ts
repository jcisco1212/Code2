import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DELETED = 'deleted'
}

interface MessageAttributes {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  status: MessageStatus;
  readAt: Date | null;
  isAgentMessage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes,
  'id' | 'status' | 'readAt' | 'isAgentMessage' | 'createdAt' | 'updatedAt'
> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public senderId!: string;
  public receiverId!: string;
  public conversationId!: string;
  public content!: string;
  public status!: MessageStatus;
  public readAt!: Date | null;
  public isAgentMessage!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'sender_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'receiver_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'conversation_id'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(MessageStatus)),
      defaultValue: MessageStatus.SENT
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    isAgentMessage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_agent_message'
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
    tableName: 'messages',
    modelName: 'Message',
    indexes: [
      { fields: ['sender_id'] },
      { fields: ['receiver_id'] },
      { fields: ['conversation_id'] },
      { fields: ['created_at'] }
    ]
  }
);

export default Message;
