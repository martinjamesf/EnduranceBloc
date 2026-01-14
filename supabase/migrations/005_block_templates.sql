-- Block Templates Table
CREATE TABLE IF NOT EXISTS block_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'block_templates' and policyname = 'Users can view their own block templates') then
    create policy "Users can view their own block templates"
      on block_templates
      for select
      using (auth.uid() = profile_id);
  end if;
end $$;

do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'block_templates' and policyname = 'Users can create their own block templates') then
    create policy "Users can create their own block templates"
      on block_templates
      for insert
      with check (auth.uid() = profile_id);
  end if;
end $$;

do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'block_templates' and policyname = 'Users can update their own block templates') then
    create policy "Users can update their own block templates"
      on block_templates
      for update
      using (auth.uid() = profile_id);
  end if;
end $$;

do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'block_templates' and policyname = 'Users can delete their own block templates') then
    create policy "Users can delete their own block templates"
      on block_templates
      for delete
      using (auth.uid() = profile_id);
  end if;
end $$;
