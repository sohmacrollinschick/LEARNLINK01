-- LearnLink: admin announcements that can fan out to notifications
-- Run in Supabase SQL Editor (or via supabase migration tools)

create extension if not exists pgcrypto;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  target text not null default 'all' check (target in ('all', 'student', 'parent', 'teacher')),
  recipient_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_created_at on public.announcements(created_at desc);
create index if not exists idx_announcements_author on public.announcements(author_id);

alter table public.announcements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'announcements' and policyname = 'announcements_insert_admin'
  ) then
    create policy announcements_insert_admin
      on public.announcements
      for insert
      with check (
        exists (
          select 1
          from public.admins a
          where a.id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'announcements' and policyname = 'announcements_select_admin'
  ) then
    create policy announcements_select_admin
      on public.announcements
      for select
      using (
        exists (
          select 1
          from public.admins a
          where a.id = auth.uid()
        )
      );
  end if;
end $$;

