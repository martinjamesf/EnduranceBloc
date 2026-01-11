-- Block Templates Table
CREATE TABLE IF NOT EXISTS block_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  default_start TEXT NOT NULL,
  default_end TEXT NOT NULL,
  recurrence JSONB NOT NULL,
  constraints JSONB,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_block_templates_profile_id ON block_templates(profile_id);
CREATE INDEX idx_block_templates_active ON block_templates(active);

-- RLS Policies
ALTER TABLE block_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own block templates"
  ON block_templates
  FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own block templates"
  ON block_templates
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own block templates"
  ON block_templates
  FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own block templates"
  ON block_templates
  FOR DELETE
  USING (auth.uid() = profile_id);
