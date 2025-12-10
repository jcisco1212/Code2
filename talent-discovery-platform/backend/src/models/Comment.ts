import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum CommentStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  FLAGGED = 'flagged',
  DELETED = 'deleted'
}

interface CommentAttributes {
  id: string;
  videoId: string;
  userId: string;
  parentId: string | null;
  content: string;
  status: CommentStatus;
  likes: number;
  replyCount: number;
  sentimentScore: number | null;
  isTroll: boolean;
  trollConfidence: number | null;
  isPinned: boolean;
  isCreatorHighlighted: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes,
  'id' | 'parentId' | 'status' | 'likes' | 'replyCount' | 'sentimentScore' |
  'isTroll' | 'trollConfidence' | 'isPinned' | 'isCreatorHighlighted' |
  'editedAt' | 'createdAt' | 'updatedAt'
> {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: string;
  public videoId!: string;
  public userId!: string;
  public parentId!: string | null;
  public content!: string;
  public status!: CommentStatus;
  public likes!: number;
  public replyCount!: number;
  public sentimentScore!: number | null;
  public isTroll!: boolean;
  public trollConfidence!: number | null;
  public isPinned!: boolean;
  public isCreatorHighlighted!: boolean;
  public editedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    videoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'video_id',
      references: {
        model: 'videos',
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
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
      references: {
        model: 'comments',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 10000]
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CommentStatus)),
      defaultValue: CommentStatus.ACTIVE
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    replyCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'reply_count'
    },
    sentimentScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'sentiment_score'
    },
    isTroll: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_troll'
    },
    trollConfidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'troll_confidence'
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pinned'
    },
    isCreatorHighlighted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_creator_highlighted'
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edited_at'
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
    tableName: 'comments',
    modelName: 'Comment',
    indexes: [
      { fields: ['video_id'] },
      { fields: ['user_id'] },
      { fields: ['parent_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
      { fields: ['is_pinned'] }
    ]
  }
);

export default Comment;
