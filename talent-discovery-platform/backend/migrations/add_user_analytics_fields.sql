-- Migration: Add country and deleted_at fields for user analytics
-- Run this migration: psql -h localhost -U postgres -d talent_discovery -f migrations/add_user_analytics_fields.sql

-- Add country field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Add deleted_at field for soft delete tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create composite index for analytics queries (created_at + country)
CREATE INDEX IF NOT EXISTS idx_users_analytics ON users(created_at, country);
