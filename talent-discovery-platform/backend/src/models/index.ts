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
  SavedVideo
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
  SavedVideo
};
