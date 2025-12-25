import User, { UserRole } from './User';
import Video, { VideoStatus, VideoVisibility } from './Video';
import Category from './Category';
import Comment, { CommentStatus } from './Comment';
import Follow from './Follow';
import Like, { LikeType, LikeTarget } from './Like';
import Notification, { NotificationType } from './Notification';
import Message, { MessageStatus } from './Message';
import AgentBookmark from './AgentBookmark';
import Report, { ReportType, ReportStatus, ReportTarget } from './Report';
import VideoView from './VideoView';
import SavedVideo from './SavedVideo';
import CompCard from './CompCard';
import ChatRoom, { ChatRoomType } from './ChatRoom';
import ChatRoomMember, { MemberRole } from './ChatRoomMember';
import ChatRoomMessage, { ChatMessageType } from './ChatRoomMessage';

// User associations
User.hasMany(Video, { foreignKey: 'userId', as: 'videos' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(Report, { foreignKey: 'reporterId', as: 'reports' });
User.hasMany(VideoView, { foreignKey: 'userId', as: 'videoViews' });

// Follow associations
User.belongsToMany(User, {
  through: Follow,
  as: 'followers',
  foreignKey: 'followingId',
  otherKey: 'followerId'
});
User.belongsToMany(User, {
  through: Follow,
  as: 'following',
  foreignKey: 'followerId',
  otherKey: 'followingId'
});

// Agent bookmarks
User.belongsToMany(User, {
  through: AgentBookmark,
  as: 'bookmarkedTalents',
  foreignKey: 'agentId',
  otherKey: 'talentId'
});
User.belongsToMany(User, {
  through: AgentBookmark,
  as: 'bookmarkedByAgents',
  foreignKey: 'talentId',
  otherKey: 'agentId'
});

// Messages
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });

// Video associations
Video.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Video.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Video.hasMany(Comment, { foreignKey: 'videoId', as: 'comments' });
Video.hasMany(VideoView, { foreignKey: 'videoId', as: 'videoViews' });

// Category associations
Category.hasMany(Video, { foreignKey: 'categoryId', as: 'videos' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });

// Comment associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

// Message associations
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Report associations
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// VideoView associations
VideoView.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });
VideoView.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AgentBookmark associations
AgentBookmark.belongsTo(User, { foreignKey: 'agentId', as: 'agent' });
AgentBookmark.belongsTo(User, { foreignKey: 'talentId', as: 'talent' });

// SavedVideo associations
SavedVideo.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SavedVideo.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });
User.hasMany(SavedVideo, { foreignKey: 'userId', as: 'savedVideos' });
Video.hasMany(SavedVideo, { foreignKey: 'videoId', as: 'saves' });

// CompCard associations
CompCard.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(CompCard, { foreignKey: 'userId', as: 'compCards' });

// ChatRoom associations
ChatRoom.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
User.hasMany(ChatRoom, { foreignKey: 'creatorId', as: 'createdChatRooms' });

// ChatRoomMember associations
ChatRoomMember.belongsTo(ChatRoom, { foreignKey: 'chatRoomId', as: 'chatRoom' });
ChatRoomMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ChatRoom.hasMany(ChatRoomMember, { foreignKey: 'chatRoomId', as: 'members' });
User.hasMany(ChatRoomMember, { foreignKey: 'userId', as: 'chatRoomMemberships' });

// ChatRoomMessage associations
ChatRoomMessage.belongsTo(ChatRoom, { foreignKey: 'chatRoomId', as: 'chatRoom' });
ChatRoomMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
ChatRoomMessage.belongsTo(ChatRoomMessage, { foreignKey: 'replyToId', as: 'replyTo' });
ChatRoom.hasMany(ChatRoomMessage, { foreignKey: 'chatRoomId', as: 'messages' });
User.hasMany(ChatRoomMessage, { foreignKey: 'senderId', as: 'chatMessages' });

export {
  User,
  UserRole,
  Video,
  VideoStatus,
  VideoVisibility,
  Category,
  Comment,
  CommentStatus,
  Follow,
  Like,
  LikeType,
  LikeTarget,
  Notification,
  NotificationType,
  Message,
  MessageStatus,
  AgentBookmark,
  Report,
  ReportType,
  ReportStatus,
  ReportTarget,
  VideoView,
  SavedVideo,
  CompCard,
  ChatRoom,
  ChatRoomType,
  ChatRoomMember,
  MemberRole,
  ChatRoomMessage,
  ChatMessageType
};

export default {
  User,
  Video,
  Category,
  Comment,
  Follow,
  Like,
  Notification,
  Message,
  AgentBookmark,
  Report,
  VideoView,
  SavedVideo,
  CompCard,
  ChatRoom,
  ChatRoomMember,
  ChatRoomMessage
};
