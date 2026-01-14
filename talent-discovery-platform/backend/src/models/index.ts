import User, { UserRole, AgentApprovalStatus } from './User';
import Video, { VideoStatus, VideoVisibility } from './Video';
import Category from './Category';
import Comment, { CommentStatus } from './Comment';
import Follow from './Follow';
import Like, { LikeType, LikeTarget } from './Like';
import Notification, { NotificationType } from './Notification';
import Message, { MessageStatus } from './Message';
import Conversation from './Conversation';
import AgentBookmark from './AgentBookmark';
import Report, { ReportType, ReportStatus, ReportTarget } from './Report';
import VideoView from './VideoView';
import SavedVideo from './SavedVideo';
import CompCard from './CompCard';
import ChatRoom, { ChatRoomType } from './ChatRoom';
import ChatRoomMember, { MemberRole } from './ChatRoomMember';
import ChatRoomMessage, { ChatMessageType } from './ChatRoomMessage';
import Challenge, { ChallengeStatus } from './Challenge';
import ChallengeEntry, { EntryStatus } from './ChallengeEntry';
import ChallengeVote from './ChallengeVote';
import Achievement, { AchievementCategory, AchievementRarity } from './Achievement';
import UserAchievement from './UserAchievement';
import Duet, { DuetLayout, DuetStatus } from './Duet';
import WatchParty, { WatchPartyStatus } from './WatchParty';
import WatchPartyParticipant from './WatchPartyParticipant';
import FeatureFlag, { FeatureCategory } from './FeatureFlag';
import AgentProfileView from './AgentProfileView';
import IndustryNotification, { IndustryEventType, IndustryNotificationStatus } from './IndustryNotification';
import BroadcastNotification, { BroadcastType, BroadcastTarget, BroadcastPriority, BroadcastStatus } from './BroadcastNotification';
import UserBroadcastStatus, { BroadcastUserStatus } from './UserBroadcastStatus';
import AdminNotificationSettings from './AdminNotificationSettings';
import AdminIndustryNotificationStatus, { AdminNotificationStatus } from './AdminIndustryNotificationStatus';
import PushSubscription from './PushSubscription';

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

// Conversations
Conversation.belongsTo(User, { foreignKey: 'participant1Id', as: 'participant1' });
Conversation.belongsTo(User, { foreignKey: 'participant2Id', as: 'participant2' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
User.hasMany(Conversation, { foreignKey: 'participant1Id', as: 'conversationsAsParticipant1' });
User.hasMany(Conversation, { foreignKey: 'participant2Id', as: 'conversationsAsParticipant2' });

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

// Challenge associations
Challenge.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Challenge.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Challenge.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });
Challenge.hasMany(ChallengeEntry, { foreignKey: 'challengeId', as: 'entries' });
User.hasMany(Challenge, { foreignKey: 'createdBy', as: 'createdChallenges' });

// ChallengeEntry associations
ChallengeEntry.belongsTo(Challenge, { foreignKey: 'challengeId', as: 'challenge' });
ChallengeEntry.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });
ChallengeEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ChallengeEntry.hasMany(ChallengeVote, { foreignKey: 'entryId', as: 'votes' });
User.hasMany(ChallengeEntry, { foreignKey: 'userId', as: 'challengeEntries' });
Video.hasMany(ChallengeEntry, { foreignKey: 'videoId', as: 'challengeEntries' });

// ChallengeVote associations
ChallengeVote.belongsTo(Challenge, { foreignKey: 'challengeId', as: 'challenge' });
ChallengeVote.belongsTo(ChallengeEntry, { foreignKey: 'entryId', as: 'entry' });
ChallengeVote.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ChallengeVote, { foreignKey: 'userId', as: 'challengeVotes' });

// Achievement associations
UserAchievement.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievementId', as: 'achievement' });
User.hasMany(UserAchievement, { foreignKey: 'userId', as: 'achievements' });
Achievement.hasMany(UserAchievement, { foreignKey: 'achievementId', as: 'userAchievements' });

// Duet associations
Duet.belongsTo(Video, { foreignKey: 'originalVideoId', as: 'originalVideo' });
Duet.belongsTo(Video, { foreignKey: 'responseVideoId', as: 'responseVideo' });
Duet.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
Video.hasMany(Duet, { foreignKey: 'originalVideoId', as: 'duets' });
Video.hasMany(Duet, { foreignKey: 'responseVideoId', as: 'duetResponses' });
User.hasMany(Duet, { foreignKey: 'creatorId', as: 'createdDuets' });

// Watch Party associations
WatchParty.belongsTo(User, { foreignKey: 'hostId', as: 'host' });
WatchParty.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });
WatchParty.hasMany(WatchPartyParticipant, { foreignKey: 'watchPartyId', as: 'participants' });
WatchPartyParticipant.belongsTo(WatchParty, { foreignKey: 'watchPartyId', as: 'watchParty' });
WatchPartyParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(WatchParty, { foreignKey: 'hostId', as: 'hostedParties' });
User.hasMany(WatchPartyParticipant, { foreignKey: 'userId', as: 'partyParticipations' });
Video.hasMany(WatchParty, { foreignKey: 'videoId', as: 'watchParties' });

// FeatureFlag associations
FeatureFlag.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
FeatureFlag.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// AgentProfileView associations
AgentProfileView.belongsTo(User, { foreignKey: 'agentId', as: 'agent' });
AgentProfileView.belongsTo(User, { foreignKey: 'talentId', as: 'talent' });
User.hasMany(AgentProfileView, { foreignKey: 'agentId', as: 'agentProfileViews' });
User.hasMany(AgentProfileView, { foreignKey: 'talentId', as: 'viewedByAgents' });

// IndustryNotification associations
IndustryNotification.belongsTo(User, { foreignKey: 'userId', as: 'industryUser' });
User.hasMany(IndustryNotification, { foreignKey: 'userId', as: 'industryNotifications' });

// BroadcastNotification associations
BroadcastNotification.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(BroadcastNotification, { foreignKey: 'createdBy', as: 'createdBroadcasts' });

// UserBroadcastStatus associations
UserBroadcastStatus.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserBroadcastStatus.belongsTo(BroadcastNotification, { foreignKey: 'broadcastId', as: 'broadcast' });
User.hasMany(UserBroadcastStatus, { foreignKey: 'userId', as: 'broadcastStatuses' });
BroadcastNotification.hasMany(UserBroadcastStatus, { foreignKey: 'broadcastId', as: 'userStatuses' });

// AdminNotificationSettings associations
AdminNotificationSettings.belongsTo(User, { foreignKey: 'userId', as: 'admin' });
User.hasOne(AdminNotificationSettings, { foreignKey: 'userId', as: 'adminNotificationSettings' });

// AdminIndustryNotificationStatus associations
AdminIndustryNotificationStatus.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
AdminIndustryNotificationStatus.belongsTo(IndustryNotification, { foreignKey: 'industryNotificationId', as: 'industryNotification' });
User.hasMany(AdminIndustryNotificationStatus, { foreignKey: 'adminId', as: 'industryNotificationStatuses' });
IndustryNotification.hasMany(AdminIndustryNotificationStatus, { foreignKey: 'industryNotificationId', as: 'adminStatuses' });

// PushSubscription associations
PushSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PushSubscription, { foreignKey: 'userId', as: 'pushSubscriptions' });

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
  Conversation,
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
  ChatMessageType,
  Challenge,
  ChallengeStatus,
  ChallengeEntry,
  EntryStatus,
  ChallengeVote,
  Achievement,
  AchievementCategory,
  AchievementRarity,
  UserAchievement,
  Duet,
  DuetLayout,
  DuetStatus,
  WatchParty,
  WatchPartyStatus,
  WatchPartyParticipant,
  FeatureFlag,
  FeatureCategory,
  AgentProfileView,
  AgentApprovalStatus,
  IndustryNotification,
  IndustryEventType,
  IndustryNotificationStatus,
  BroadcastNotification,
  BroadcastType,
  BroadcastTarget,
  BroadcastPriority,
  BroadcastStatus,
  UserBroadcastStatus,
  BroadcastUserStatus,
  AdminNotificationSettings,
  AdminIndustryNotificationStatus,
  AdminNotificationStatus,
  PushSubscription
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
  Conversation,
  AgentBookmark,
  Report,
  VideoView,
  SavedVideo,
  CompCard,
  ChatRoom,
  ChatRoomMember,
  ChatRoomMessage,
  Challenge,
  ChallengeEntry,
  ChallengeVote,
  Achievement,
  UserAchievement,
  Duet,
  WatchParty,
  WatchPartyParticipant,
  FeatureFlag,
  AgentProfileView,
  IndustryNotification,
  BroadcastNotification,
  UserBroadcastStatus,
  AdminNotificationSettings,
  AdminIndustryNotificationStatus,
  PushSubscription
};
