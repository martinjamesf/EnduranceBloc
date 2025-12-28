-- Initial schema for EnduranceBloc

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  tz text,
  created_at timestamptz default now()
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  title text,
  type text,
  start timestamptz,
  "end" timestamptz,
  notes text,
  source text,
  profile_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  title text,
  start timestamptz,
  "end" timestamptz,
  workouts jsonb,
  profile_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id),
  suggestion text,
  score float,
  created_at timestamptz default now()
);
