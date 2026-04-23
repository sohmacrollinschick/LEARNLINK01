-- LearnLink: archive state for offline_downloads
-- Run in Supabase SQL Editor (or via supabase migration tools)

alter table public.offline_downloads
  add column if not exists archived boolean not null default true;

alter table public.offline_downloads
  add column if not exists archived_at timestamptz;

update public.offline_downloads
set archived_at = coalesce(archived_at, downloaded_at, now())
where archived = true;

create index if not exists idx_offline_downloads_user_archived
  on public.offline_downloads(user_id, archived);

