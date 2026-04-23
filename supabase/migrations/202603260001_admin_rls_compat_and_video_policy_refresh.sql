-- LearnLink: make admin checks resilient across admin table layouts
-- and refresh video upload policies to use a single helper.

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
  if to_regclass('public.subjects') is not null then
    execute 'alter table public.subjects enable row level security';
    execute 'drop policy if exists subjects_select_authenticated on public.subjects';
    execute 'drop policy if exists subjects_insert_admin on public.subjects';
    execute 'drop policy if exists subjects_update_admin on public.subjects';
    execute 'drop policy if exists subjects_delete_admin on public.subjects';

    execute 'create policy subjects_select_authenticated on public.subjects for select to authenticated using (true)';
    execute 'create policy subjects_insert_admin on public.subjects for insert to authenticated with check (public.is_admin(auth.uid()))';
    execute 'create policy subjects_update_admin on public.subjects for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))';
    execute 'create policy subjects_delete_admin on public.subjects for delete to authenticated using (public.is_admin(auth.uid()))';
  end if;
end $$;

do $$
begin
  if to_regclass('public.videos') is not null then
    execute 'alter table public.videos enable row level security';
    execute 'drop policy if exists videos_select_authenticated on public.videos';
    execute 'drop policy if exists videos_insert_admin on public.videos';
    execute 'drop policy if exists videos_update_admin on public.videos';
    execute 'drop policy if exists videos_delete_admin on public.videos';

    execute 'create policy videos_select_authenticated on public.videos for select to authenticated using (true)';
    execute 'create policy videos_insert_admin on public.videos for insert to authenticated with check (public.is_admin(auth.uid()))';
    execute 'create policy videos_update_admin on public.videos for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))';
    execute 'create policy videos_delete_admin on public.videos for delete to authenticated using (public.is_admin(auth.uid()))';
  end if;
end $$;

do $$
begin
  if to_regclass('public.video_parts') is not null then
    execute 'alter table public.video_parts enable row level security';
    execute 'drop policy if exists video_parts_select_authenticated on public.video_parts';
    execute 'drop policy if exists video_parts_insert_admin on public.video_parts';
    execute 'drop policy if exists video_parts_update_admin on public.video_parts';
    execute 'drop policy if exists video_parts_delete_admin on public.video_parts';

    execute 'create policy video_parts_select_authenticated on public.video_parts for select to authenticated using (true)';
    execute 'create policy video_parts_insert_admin on public.video_parts for insert to authenticated with check (public.is_admin(auth.uid()))';
    execute 'create policy video_parts_update_admin on public.video_parts for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))';
    execute 'create policy video_parts_delete_admin on public.video_parts for delete to authenticated using (public.is_admin(auth.uid()))';
  end if;
end $$;

do $$
begin
  if to_regclass('public.quizzes') is not null then
    execute 'alter table public.quizzes enable row level security';
    execute 'drop policy if exists quizzes_select_authenticated on public.quizzes';
    execute 'drop policy if exists quizzes_insert_admin on public.quizzes';
    execute 'drop policy if exists quizzes_update_admin on public.quizzes';
    execute 'drop policy if exists quizzes_delete_admin on public.quizzes';

    execute 'create policy quizzes_select_authenticated on public.quizzes for select to authenticated using (true)';
    execute 'create policy quizzes_insert_admin on public.quizzes for insert to authenticated with check (public.is_admin(auth.uid()))';
    execute 'create policy quizzes_update_admin on public.quizzes for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))';
    execute 'create policy quizzes_delete_admin on public.quizzes for delete to authenticated using (public.is_admin(auth.uid()))';
  end if;
end $$;

do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists storage_objects_videos_select_authenticated on storage.objects';
    execute 'drop policy if exists storage_objects_videos_insert_admin on storage.objects';
    execute 'drop policy if exists storage_objects_videos_update_admin on storage.objects';
    execute 'drop policy if exists storage_objects_videos_delete_admin on storage.objects';

    execute $sql$
      create policy storage_objects_videos_select_authenticated on storage.objects
      for select to authenticated
      using (bucket_id in ('videos', 'thumbnails'))
    $sql$;

    execute $sql$
      create policy storage_objects_videos_insert_admin on storage.objects
      for insert to authenticated
      with check (
        bucket_id in ('videos', 'thumbnails')
        and public.is_admin(auth.uid())
      )
    $sql$;

    execute $sql$
      create policy storage_objects_videos_update_admin on storage.objects
      for update to authenticated
      using (
        bucket_id in ('videos', 'thumbnails')
        and public.is_admin(auth.uid())
      )
      with check (
        bucket_id in ('videos', 'thumbnails')
        and public.is_admin(auth.uid())
      )
    $sql$;

    execute $sql$
      create policy storage_objects_videos_delete_admin on storage.objects
      for delete to authenticated
      using (
        bucket_id in ('videos', 'thumbnails')
        and public.is_admin(auth.uid())
      )
    $sql$;
  end if;
end $$;
