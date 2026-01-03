-- Add Google Calendar integration fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_connected_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_calendar_token ON profiles(google_calendar_token) WHERE google_calendar_token IS NOT NULL;
