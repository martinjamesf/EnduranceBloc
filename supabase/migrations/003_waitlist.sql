-- Waitlist table for coming soon page
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now(),
  ip_address text
);

-- Enable RLS
alter table waitlist enable row level security;

-- Allow anyone to insert (public signup)
create policy "Anyone can insert waitlist entries" on waitlist
  for insert
  with check (true);

-- Allow anyone to read (for checking duplicates)
create policy "Anyone can read waitlist" on waitlist
  for select
  with check (true);
