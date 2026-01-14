-- Enable RLS on ai_insights table
-- This migration adds user ownership tracking and row-level security policies

-- Step 1: Add profile_id column if it doesn't exist (for user ownership tracking)
ALTER TABLE public.ai_insights
ADD COLUMN IF NOT EXISTS profile_id uuid references profiles(id) on delete cascade;

-- Step 2: Enable Row-Level Security
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Step 3: Create index on profile_id for policy performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_profile_id ON public.ai_insights(profile_id);

-- Step 4: Create RLS policies for authenticated users
-- Users can only SELECT/UPDATE/DELETE their own insights via profile ownership
do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'ai_insights' and policyname = 'ai_insights_owner_select') then
    create policy "ai_insights_owner_select"
      on public.ai_insights
      for select
      to authenticated
      using (profile_id = (select auth.uid()::uuid));
  end if;
end $$;

do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'ai_insights' and policyname = 'ai_insights_owner_insert') then
    create policy "ai_insights_owner_insert"
      on public.ai_insights
      for insert
      to authenticated
      with check (profile_id = (select auth.uid()::uuid));
  end if;
end $$;

do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'ai_insights' and policyname = 'ai_insights_owner_update') then
    create policy "ai_insights_owner_update"
      on public.ai_insights
      for update
      to authenticated
      using (profile_id = (select auth.uid()::uuid))
      with check (profile_id = (select auth.uid()::uuid));
  end if;
end $$;

do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'ai_insights' and policyname = 'ai_insights_owner_delete') then
    create policy "ai_insights_owner_delete"
      on public.ai_insights
      for delete
      to authenticated
      using (profile_id = (select auth.uid()::uuid));
  end if;
end $$;

-- Step 5: Allow service_role to bypass RLS (for backend operations)
-- Note: This is implicit for service_role, but documented here for clarity
