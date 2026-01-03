-- Migration: Add new notification types and user roles
-- Run this migration to add the new enum values
-- Uses Sequelize-style enum names (enum_tablename_columnname)

-- First, add super_admin to user_role enum (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = 'enum_users_role'::regtype) THEN
        ALTER TYPE enum_users_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- Add new notification type values
DO $$
BEGIN
    -- Core notification types
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'new_follower' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'new_follower';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video_like' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'video_like';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video_comment' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'video_comment';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'comment_reply' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'comment_reply';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'comment_like' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'comment_like';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video_published' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'video_published';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video_featured' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'video_featured';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video_trending' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'video_trending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'agent_message' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'agent_message';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'agent_bookmark' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'agent_bookmark';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'system_announcement' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'system_announcement';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'moderation_action' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'moderation_action';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'duet' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'duet';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'watch_party' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'watch_party';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'achievement' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'achievement';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'challenge' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'challenge';
    END IF;

    -- Report notification types
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'report_submitted' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'report_submitted';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'report_received' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'report_received';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'report_reviewed' AND enumtypid = 'enum_notifications_type'::regtype) THEN
        ALTER TYPE enum_notifications_type ADD VALUE 'report_reviewed';
    END IF;
END $$;
