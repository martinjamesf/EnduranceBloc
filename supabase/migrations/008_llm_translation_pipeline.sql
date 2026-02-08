-- LLM Translation Pipeline: raw ingestion, jobs, canonical storage
-- Safe to run multiple times in dev; uses IF NOT EXISTS where possible.

-- Extensions
create extension if not exists pgcrypto;

-- Raw workouts (vendor payloads as-is)
create table if not exists public.raw_workouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  source text not null default 'unknown',
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists raw_workouts_profile_id_idx on public.raw_workouts (profile_id);
create index if not exists raw_workouts_received_at_idx on public.raw_workouts (received_at);

alter table public.raw_workouts enable row level security;
-- Allow users to manage only their rows
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'raw_workouts' and policyname = 'raw_workouts_select_own'
  ) then
    create policy raw_workouts_select_own on public.raw_workouts
      for select using (profile_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'raw_workouts' and policyname = 'raw_workouts_insert_own'
  ) then
    create policy raw_workouts_insert_own on public.raw_workouts
      for insert with check (profile_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'raw_workouts' and policyname = 'raw_workouts_update_own'
  ) then
    create policy raw_workouts_update_own on public.raw_workouts
      for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'raw_workouts' and policyname = 'raw_workouts_delete_own'
  ) then
    create policy raw_workouts_delete_own on public.raw_workouts
      for delete using (profile_id = auth.uid());
  end if;
end$$;

-- Translator jobs (queue)
create table if not exists public.translator_jobs (
  id uuid primary key default gen_random_uuid(),
  raw_workout_id uuid not null references public.raw_workouts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','succeeded','failed','dead_letter')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists translator_jobs_status_idx on public.translator_jobs (status);
create index if not exists translator_jobs_created_at_idx on public.translator_jobs (created_at);

-- Canonical workouts (normalized schema)
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  raw_workout_id uuid references public.raw_workouts(id) on delete set null,
  source text not null,
  type text not null,
  subtype text,
  duration_min numeric,
  distance_km numeric,
  intensity jsonb,
  structured boolean not null default false,
  steps jsonb not null default '[]'::jsonb,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workouts_profile_id_idx on public.workouts (profile_id);
create index if not exists workouts_created_at_idx on public.workouts (created_at);

alter table public.workouts enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workouts' and policyname = 'workouts_select_own'
  ) then
    create policy workouts_select_own on public.workouts
      for select using (profile_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workouts' and policyname = 'workouts_insert_own'
  ) then
    create policy workouts_insert_own on public.workouts
      for insert with check (profile_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workouts' and policyname = 'workouts_update_own'
  ) then
    create policy workouts_update_own on public.workouts
      for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workouts' and policyname = 'workouts_delete_own'
  ) then
    create policy workouts_delete_own on public.workouts
      for delete using (profile_id = auth.uid());
  end if;
end$$;

-- Dead-letter table for failed translations
create table if not exists public.translator_dead_letter (
  id uuid primary key default gen_random_uuid(),
  raw_workout_id uuid references public.raw_workouts(id) on delete cascade,
  job_id uuid references public.translator_jobs(id) on delete cascade,
  error text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists translator_dead_letter_created_at_idx on public.translator_dead_letter (created_at);
