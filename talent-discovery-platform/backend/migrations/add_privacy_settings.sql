-- Add privacy_settings column to users table
-- Run this migration to add privacy settings support

-- Add privacy_settings JSONB column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "showAge": true,
  "showDateOfBirth": false,
  "showEthnicity": true,
  "showLocation": true,
  "showGender": true
}'::jsonb;

-- Create index for privacy settings queries
CREATE INDEX IF NOT EXISTS idx_users_privacy_settings ON users USING GIN(privacy_settings);

COMMIT;
