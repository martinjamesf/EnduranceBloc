create extension if not exists "pgcrypto";

create table if not exists google_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  sync_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (profile_id)
);

create table if not exists google_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references google_accounts(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  event_id text not null,
  title text,
  description text,
  start timestamptz,
  "end" timestamptz,
  status text,
  external_updated_at timestamptz,
  raw_payload jsonb,
  conflict boolean default false,
  local_block_id uuid references blocks(id) on delete set null,
  sync_state text default 'synced',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (account_id, event_id)
);

create index if not exists google_events_profile_idx on google_events(profile_id);
create index if not exists google_events_account_idx on google_events(account_id);
create index if not exists google_events_block_idx on google_events(local_block_id);
create index if not exists google_events_sync_state_idx on google_events(sync_state);
