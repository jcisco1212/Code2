import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum FeatureCategory {
  CONTENT = 'content',
  SOCIAL = 'social',
  ENGAGEMENT = 'engagement',
  MONETIZATION = 'monetization',
  AI = 'ai',
  ADMIN = 'admin',
  EXPERIMENTAL = 'experimental'
}

interface FeatureFlagAttributes {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: FeatureCategory;
  isEnabled: boolean;
  enabledForRoles: string[] | null;
  enabledForUsers: string[] | null;
  config: Record<string, any> | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FeatureFlagCreationAttributes extends Optional<FeatureFlagAttributes,
  'id' | 'description' | 'isEnabled' | 'enabledForRoles' | 'enabledForUsers' |
  'config' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'
> {}

class FeatureFlag extends Model<FeatureFlagAttributes, FeatureFlagCreationAttributes> implements FeatureFlagAttributes {
  declare id: string;
  declare key: string;
  declare name: string;
  declare description: string | null;
  declare category: FeatureCategory;
  declare isEnabled: boolean;
  declare enabledForRoles: string[] | null;
  declare enabledForUsers: string[] | null;
  declare config: Record<string, any> | null;
  declare createdBy: string | null;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Check if feature is enabled for a specific user/role
  public isEnabledFor(userId?: string, userRole?: string): boolean {
    // If globally enabled, return true
    if (this.isEnabled) return true;

    // Check role-based access
    if (userRole && this.enabledForRoles?.includes(userRole)) {
      return true;
    }

    // Check user-based access
    if (userId && this.enabledForUsers?.includes(userId)) {
      return true;
    }

    return false;
  }
}

FeatureFlag.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('content', 'social', 'engagement', 'monetization', 'ai', 'admin', 'experimental'),
      defaultValue: 'content'
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_enabled'
    },
    enabledForRoles: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      field: 'enabled_for_roles'
    },
    enabledForUsers: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      field: 'enabled_for_users'
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by',
      references: {
        model: 'users',
        key: 'id'
      }
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
    tableName: 'feature_flags',
    modelName: 'FeatureFlag',
    indexes: [
      { fields: ['key'], unique: true },
      { fields: ['category'] },
      { fields: ['is_enabled'] }
    ]
  }
);

// Default feature flags to seed
export const DEFAULT_FEATURES = [
  // Content Features
  { key: 'video_uploads', name: 'Video Uploads', category: 'content', description: 'Allow users to upload videos' },
  { key: 'video_chapters', name: 'Video Chapters', category: 'content', description: 'Enable video chapter markers' },
  { key: 'audio_only_mode', name: 'Audio-Only Mode', category: 'content', description: 'Allow audio-only uploads for singers/voice actors' },
  { key: 'ai_auto_tags', name: 'AI Auto-Tags', category: 'ai', description: 'Automatically tag videos using AI' },
  { key: 'clips', name: 'Clips', category: 'content', description: 'Enable short-form clips feature' },

  // Social Features
  { key: 'comments', name: 'Comments', category: 'social', description: 'Allow comments on videos' },
  { key: 'likes', name: 'Likes', category: 'social', description: 'Allow likes/reactions on content' },
  { key: 'follows', name: 'Follows', category: 'social', description: 'Allow users to follow each other' },
  { key: 'messaging', name: 'Direct Messages', category: 'social', description: 'Enable direct messaging between users' },
  { key: 'chat_rooms', name: 'Chat Rooms', category: 'social', description: 'Enable group chat rooms' },

  // Engagement Features
  { key: 'challenges', name: 'Challenges', category: 'engagement', description: 'Enable community challenges' },
  { key: 'achievements', name: 'Achievements & Badges', category: 'engagement', description: 'Enable gamification achievements' },
  { key: 'duets', name: 'Duets/Collabs', category: 'engagement', description: 'Enable split-screen duet videos' },
  { key: 'watch_parties', name: 'Watch Parties', category: 'engagement', description: 'Enable synchronized watch parties' },
  { key: 'embeds', name: 'Embeddable Player', category: 'engagement', description: 'Allow embedding videos on external sites' },

  // AI Features
  { key: 'ai_scoring', name: 'AI Talent Scoring', category: 'ai', description: 'Enable AI-powered talent scoring' },
  { key: 'ai_chatbot', name: 'AI Support Chatbot', category: 'ai', description: 'Enable AI-powered support chatbot' },
  { key: 'ai_moderation', name: 'AI Content Moderation', category: 'ai', description: 'Enable AI-powered content moderation' },

  // Monetization Features
  { key: 'comp_cards', name: 'Comp Cards', category: 'monetization', description: 'Enable digital comp card generation' },
  { key: 'agent_features', name: 'Agent Features', category: 'monetization', description: 'Enable agent/talent discovery features' },

  // Admin Features
  { key: 'announcements', name: 'Announcements', category: 'admin', description: 'Enable platform announcements' },
  { key: 'user_reports', name: 'User Reports', category: 'admin', description: 'Allow users to report content' },

  // Experimental
  { key: 'live_streaming', name: 'Live Streaming', category: 'experimental', description: 'Enable live streaming (experimental)', isEnabled: false },
  { key: 'green_screen', name: 'Green Screen Mode', category: 'experimental', description: 'Enable green screen duet mode (experimental)', isEnabled: false }
];

export default FeatureFlag;
