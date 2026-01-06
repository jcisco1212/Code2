-- Migration: Add agent approval fields for verification system
-- This adds fields to track agent account verification status

-- Create enum type for approval status
DO $$ BEGIN
    CREATE TYPE agent_approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add agent approval fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_approval_status agent_approval_status;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_approval_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_approved_by UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_license_number VARCHAR(100);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_agent_approval_status ON users(agent_approval_status);
CREATE INDEX IF NOT EXISTS idx_users_agent_pending ON users(role, agent_approval_status) WHERE role = 'agent';

-- Update existing agents to have 'approved' status (grandfathering)
UPDATE users SET agent_approval_status = 'approved' WHERE role = 'agent' AND agent_approval_status IS NULL;
