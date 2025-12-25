import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

interface ChatRoomMemberAttributes {
  id: string;
  chatRoomId: string;
  userId: string;
  role: MemberRole;
  nickname: string | null;
  lastReadAt: Date | null;
  isMuted: boolean;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatRoomMemberCreationAttributes extends Optional<ChatRoomMemberAttributes,
  'id' | 'role' | 'nickname' | 'lastReadAt' | 'isMuted' | 'joinedAt' | 'createdAt' | 'updatedAt'
> {}

class ChatRoomMember extends Model<ChatRoomMemberAttributes, ChatRoomMemberCreationAttributes> implements ChatRoomMemberAttributes {
  declare id: string;
  declare chatRoomId: string;
  declare userId: string;
  declare role: MemberRole;
  declare nickname: string | null;
  declare lastReadAt: Date | null;
  declare isMuted: boolean;
  declare joinedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare user?: any;
  declare chatRoom?: any;

  toPublicJSON() {
    return {
      id: this.id,
      chatRoomId: this.chatRoomId,
      userId: this.userId,
      role: this.role,
      nickname: this.nickname,
      lastReadAt: this.lastReadAt,
      isMuted: this.isMuted,
      joinedAt: this.joinedAt,
      user: this.user
    };
  }
}

ChatRoomMember.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM(...Object.values(MemberRole)),
      defaultValue: MemberRole.MEMBER
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_read_at'
    },
    isMuted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_muted'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at'
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
    tableName: 'chat_room_members',
    modelName: 'ChatRoomMember',
    indexes: [
      { fields: ['chat_room_id', 'user_id'], unique: true },
      { fields: ['user_id'] },
      { fields: ['chat_room_id'] }
    ]
  }
);

export default ChatRoomMember;
