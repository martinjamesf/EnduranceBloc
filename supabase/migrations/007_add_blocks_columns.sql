-- Add missing columns to blocks table for Sunday Prep functionality

ALTER TABLE blocks ADD COLUMN IF NOT EXISTS day_of_week integer;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS notes text;

-- Create index on profile_id and day_of_week for faster queries
CREATE INDEX IF NOT EXISTS idx_blocks_profile_day ON blocks(profile_id, day_of_week);
