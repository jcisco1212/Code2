import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum ChatMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system'
}

interface ChatRoomMessageAttributes {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: ChatMessageType;
  attachmentUrl: string | null;
  attachmentName: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatRoomMessageCreationAttributes extends Optional<ChatRoomMessageAttributes,
  'id' | 'messageType' | 'attachmentUrl' | 'attachmentName' | 'isEdited' |
  'isDeleted' | 'replyToId' | 'createdAt' | 'updatedAt'
> {}

class ChatRoomMessage extends Model<ChatRoomMessageAttributes, ChatRoomMessageCreationAttributes> implements ChatRoomMessageAttributes {
  declare id: string;
  declare chatRoomId: string;
  declare senderId: string;
  declare content: string;
  declare messageType: ChatMessageType;
  declare attachmentUrl: string | null;
  declare attachmentName: string | null;
  declare isEdited: boolean;
  declare isDeleted: boolean;
  declare replyToId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare sender?: any;
  declare chatRoom?: any;
  declare replyTo?: ChatRoomMessage;

  toPublicJSON() {
    return {
      id: this.id,
      chatRoomId: this.chatRoomId,
      senderId: this.senderId,
      content: this.isDeleted ? '[Message deleted]' : this.content,
      messageType: this.messageType,
      attachmentUrl: this.isDeleted ? null : this.attachmentUrl,
      attachmentName: this.isDeleted ? null : this.attachmentName,
      isEdited: this.isEdited,
      isDeleted: this.isDeleted,
      replyToId: this.replyToId,
      sender: this.sender,
      replyTo: this.replyTo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

ChatRoomMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    chatRoomId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'chat_room_id',
      references: {
        model: 'chat_rooms',
        key: 'id'
      }
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    messageType: {
      type: DataTypes.ENUM(...Object.values(ChatMessageType)),
      defaultValue: ChatMessageType.TEXT,
      field: 'message_type'
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'attachment_url'
    },
    attachmentName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'attachment_name'
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_edited'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    },
    replyToId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reply_to_id'
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
    tableName: 'chat_room_messages',
    modelName: 'ChatRoomMessage',
    indexes: [
      { fields: ['chat_room_id', 'created_at'] },
      { fields: ['sender_id'] },
      { fields: ['reply_to_id'] }
    ]
  }
);

export default ChatRoomMessage;
