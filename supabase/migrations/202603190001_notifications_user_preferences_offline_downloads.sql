-- LearnLink: Header + Offline system database wiring
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

-- =========================
-- Notifications (Header)
-- =========================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_select_own'
  ) then
    create policy notifications_select_own
      on public.notifications
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_update_own'
  ) then
    create policy notifications_update_own
      on public.notifications
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_insert_admin'
  ) then
    create policy notifications_insert_admin
      on public.notifications
      for insert
      with check (
        exists (
          select 1
          from public.admins a
          where a.id = auth.uid()
        )
      );
  end if;
end $$;

-- =========================
-- User preferences (offline + header behavior)
-- =========================
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  offline_enabled boolean not null default true,
  push_notifications boolean not null default true,
  video_autoplay boolean not null default true,
  video_quality text not null default 'auto' check (video_quality in ('auto', 'low', 'medium', 'high')),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences' and policyname = 'user_preferences_select_own'
  ) then
    create policy user_preferences_select_own
      on public.user_preferences
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences' and policyname = 'user_preferences_insert_own'
  ) then
    create policy user_preferences_insert_own
      on public.user_preferences
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences' and policyname = 'user_preferences_update_own'
  ) then
    create policy user_preferences_update_own
      on public.user_preferences
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.touch_user_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
before update on public.user_preferences
for each row
execute function public.touch_user_preferences_updated_at();

-- =========================
-- Offline download metadata sync
-- =========================
create table if not exists public.offline_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  title text,
  subject text,
  storage_path text,
  downloaded_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create index if not exists idx_offline_downloads_user on public.offline_downloads(user_id);

alter table public.offline_downloads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'offline_downloads' and policyname = 'offline_downloads_select_own'
  ) then
    create policy offline_downloads_select_own
      on public.offline_downloads
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'offline_downloads' and policyname = 'offline_downloads_insert_own'
  ) then
    create policy offline_downloads_insert_own
      on public.offline_downloads
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'offline_downloads' and policyname = 'offline_downloads_update_own'
  ) then
    create policy offline_downloads_update_own
      on public.offline_downloads
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'offline_downloads' and policyname = 'offline_downloads_delete_own'
  ) then
    create policy offline_downloads_delete_own
      on public.offline_downloads
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;
