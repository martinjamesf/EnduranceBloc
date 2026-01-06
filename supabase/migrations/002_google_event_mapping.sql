alter table google_events
  add column if not exists local_block_id uuid references blocks(id) on delete set null,
  add column if not exists sync_state text default 'synced';

create index if not exists google_events_block_idx on google_events(local_block_id);
create index if not exists google_events_sync_state_idx on google_events(sync_state);
