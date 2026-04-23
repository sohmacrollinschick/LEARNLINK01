-- LearnLink: video transcript RAG support for quiz generation
-- Adds transcript chunks + vector similarity function for per-lesson retrieval.

create extension if not exists vector;

create or replace function public.is_admin(candidate uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  has_id_column boolean;
  has_user_id_column boolean;
  matched boolean := false;
begin
  if candidate is null then
    return false;
  end if;

  if to_regclass('public.admins') is null then
    return false;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admins'
      and column_name = 'id'
  )
  into has_id_column;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admins'
      and column_name = 'user_id'
  )
  into has_user_id_column;

  if has_id_column then
    execute 'select exists(select 1 from public.admins where id = $1)'
    into matched
    using candidate;
    if matched then
      return true;
    end if;
  end if;

  if has_user_id_column then
    execute 'select exists(select 1 from public.admins where user_id = $1)'
    into matched
    using candidate;
    if matched then
      return true;
    end if;
  end if;

  return false;
end;
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

do $$
begin
  if to_regclass('public.video_parts') is not null then
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'video_parts'
        and column_name = 'transcript_status'
    ) then
      alter table public.video_parts
        add column transcript_status text not null default 'pending'
        check (transcript_status in ('pending', 'processing', 'ready', 'failed'));
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'video_parts'
        and column_name = 'transcript_error'
    ) then
      alter table public.video_parts add column transcript_error text;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'video_parts'
        and column_name = 'transcript_updated_at'
    ) then
      alter table public.video_parts add column transcript_updated_at timestamptz;
    end if;
  end if;
end $$;

create table if not exists public.video_transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  video_part_id uuid not null references public.video_parts(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  start_seconds numeric(10,3),
  end_seconds numeric(10,3),
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  unique (video_part_id, chunk_index)
);

create index if not exists video_transcript_chunks_video_part_id_idx
  on public.video_transcript_chunks(video_part_id);

create index if not exists video_transcript_chunks_embedding_idx
  on public.video_transcript_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_video_transcript_chunks(
  p_video_part_id uuid,
  p_query_embedding vector(1536),
  p_match_count integer default 8
)
returns table (
  id uuid,
  video_part_id uuid,
  chunk_index integer,
  content text,
  start_seconds numeric,
  end_seconds numeric,
  similarity double precision
)
language sql
stable
as $$
  select
    c.id,
    c.video_part_id,
    c.chunk_index,
    c.content,
    c.start_seconds,
    c.end_seconds,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.video_transcript_chunks c
  where c.video_part_id = p_video_part_id
  order by c.embedding <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 8), 20));
$$;

alter table public.video_transcript_chunks enable row level security;

drop policy if exists video_transcript_chunks_select_authenticated on public.video_transcript_chunks;
create policy video_transcript_chunks_select_authenticated
  on public.video_transcript_chunks
  for select
  to authenticated
  using (true);

drop policy if exists video_transcript_chunks_admin_insert on public.video_transcript_chunks;
create policy video_transcript_chunks_admin_insert
  on public.video_transcript_chunks
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists video_transcript_chunks_admin_update on public.video_transcript_chunks;
create policy video_transcript_chunks_admin_update
  on public.video_transcript_chunks
  for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists video_transcript_chunks_admin_delete on public.video_transcript_chunks;
create policy video_transcript_chunks_admin_delete
  on public.video_transcript_chunks
  for delete
  to authenticated
  using (public.is_admin(auth.uid()));
