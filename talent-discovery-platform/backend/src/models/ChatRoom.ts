import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum ChatRoomType {
  PROJECT = 'project',
  COMMUNITY = 'community',
  PRIVATE = 'private'
}

interface ChatRoomAttributes {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  type: ChatRoomType;
  creatorId: string;
  isActive: boolean;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  inviteCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatRoomCreationAttributes extends Optional<ChatRoomAttributes,
  'id' | 'description' | 'avatarUrl' | 'isActive' | 'lastMessageAt' |
  'lastMessagePreview' | 'memberCount' | 'maxMembers' | 'isPublic' |
  'inviteCode' | 'createdAt' | 'updatedAt'
> {}

class ChatRoom extends Model<ChatRoomAttributes, ChatRoomCreationAttributes> implements ChatRoomAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare avatarUrl: string | null;
  declare type: ChatRoomType;
  declare creatorId: string;
  declare isActive: boolean;
  declare lastMessageAt: Date | null;
  declare lastMessagePreview: string | null;
  declare memberCount: number;
  declare maxMembers: number;
  declare isPublic: boolean;
  declare inviteCode: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare creator?: any;
  declare members?: any[];

  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      avatarUrl: this.avatarUrl,
      type: this.type,
      creatorId: this.creatorId,
      isActive: this.isActive,
      lastMessageAt: this.lastMessageAt,
      lastMessagePreview: this.lastMessagePreview,
      memberCount: this.memberCount,
      maxMembers: this.maxMembers,
      isPublic: this.isPublic,
      inviteCode: this.inviteCode,
      creator: this.creator,
      members: this.members,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Generate a unique invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

ChatRoom.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_url'
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ChatRoomType)),
      defaultValue: ChatRoomType.PROJECT
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'creator_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
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
    memberCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'member_count'
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      field: 'max_members'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_public'
    },
    inviteCode: {
      type: DataTypes.STRING(20),
      unique: true,
      defaultValue: generateInviteCode,
      field: 'invite_code'
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
    tableName: 'chat_rooms',
    modelName: 'ChatRoom',
    indexes: [
      { fields: ['creator_id'] },
      { fields: ['type'] },
      { fields: ['is_public'] },
      { fields: ['invite_code'], unique: true },
      { fields: ['last_message_at'] }
    ]
  }
);

export default ChatRoom;
