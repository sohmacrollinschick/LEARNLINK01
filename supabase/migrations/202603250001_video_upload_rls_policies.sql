-- LearnLink: allow admin video upload/manage flows under RLS
-- Covers tables used by /admin/upload/videos and storage buckets "videos"/"thumbnails"

do $$
begin
  if to_regclass('public.subjects') is not null then
    execute 'alter table public.subjects enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'subjects' and policyname = 'subjects_select_authenticated'
    ) then
      execute 'create policy subjects_select_authenticated on public.subjects for select to authenticated using (true)';
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'subjects' and policyname = 'subjects_insert_admin'
    ) then
      execute $sql$
        create policy subjects_insert_admin on public.subjects
        for insert to authenticated
        with check (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'subjects' and policyname = 'subjects_update_admin'
    ) then
      execute $sql$
        create policy subjects_update_admin on public.subjects
        for update to authenticated
        using (exists (select 1 from public.admins a where a.id = auth.uid()))
        with check (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'subjects' and policyname = 'subjects_delete_admin'
    ) then
      execute $sql$
        create policy subjects_delete_admin on public.subjects
        for delete to authenticated
        using (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.videos') is not null then
    execute 'alter table public.videos enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'videos' and policyname = 'videos_select_authenticated'
    ) then
      execute 'create policy videos_select_authenticated on public.videos for select to authenticated using (true)';
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'videos' and policyname = 'videos_insert_admin'
    ) then
      execute $sql$
        create policy videos_insert_admin on public.videos
        for insert to authenticated
        with check (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'videos' and policyname = 'videos_update_admin'
    ) then
      execute $sql$
        create policy videos_update_admin on public.videos
        for update to authenticated
        using (exists (select 1 from public.admins a where a.id = auth.uid()))
        with check (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'videos' and policyname = 'videos_delete_admin'
    ) then
      execute $sql$
        create policy videos_delete_admin on public.videos
        for delete to authenticated
        using (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.video_parts') is not null then
    execute 'alter table public.video_parts enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'video_parts' and policyname = 'video_parts_select_authenticated'
    ) then
      execute 'create policy video_parts_select_authenticated on public.video_parts for select to authenticated using (true)';
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'video_parts' and policyname = 'video_parts_insert_admin'
    ) then
      execute $sql$
        create policy video_parts_insert_admin on public.video_parts
        for insert to authenticated
        with check (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'video_parts' and policyname = 'video_parts_update_admin'
    ) then
      execute $sql$
        create policy video_parts_update_admin on public.video_parts
        for update to authenticated
        using (exists (select 1 from public.admins a where a.id = auth.uid()))
        with check (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'video_parts' and policyname = 'video_parts_delete_admin'
    ) then
      execute $sql$
        create policy video_parts_delete_admin on public.video_parts
        for delete to authenticated
        using (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.quizzes') is not null then
    execute 'alter table public.quizzes enable row level security';

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'quizzes' and policyname = 'quizzes_select_authenticated'
    ) then
      execute 'create policy quizzes_select_authenticated on public.quizzes for select to authenticated using (true)';
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'quizzes' and policyname = 'quizzes_insert_admin'
    ) then
      execute $sql$
        create policy quizzes_insert_admin on public.quizzes
        for insert to authenticated
        with check (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'quizzes' and policyname = 'quizzes_update_admin'
    ) then
      execute $sql$
        create policy quizzes_update_admin on public.quizzes
        for update to authenticated
        using (exists (select 1 from public.admins a where a.id = auth.uid()))
        with check (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'quizzes' and policyname = 'quizzes_delete_admin'
    ) then
      execute $sql$
        create policy quizzes_delete_admin on public.quizzes
        for delete to authenticated
        using (exists (select 1 from public.admins a where a.id = auth.uid()))
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('storage.objects') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'storage_objects_videos_select_authenticated'
    ) then
      execute $sql$
        create policy storage_objects_videos_select_authenticated on storage.objects
        for select to authenticated
        using (bucket_id in ('videos', 'thumbnails'))
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'storage_objects_videos_insert_admin'
    ) then
      execute $sql$
        create policy storage_objects_videos_insert_admin on storage.objects
        for insert to authenticated
        with check (
          bucket_id in ('videos', 'thumbnails')
          and exists (select 1 from public.admins a where a.id = auth.uid())
        )
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'storage_objects_videos_update_admin'
    ) then
      execute $sql$
        create policy storage_objects_videos_update_admin on storage.objects
        for update to authenticated
        using (
          bucket_id in ('videos', 'thumbnails')
          and exists (select 1 from public.admins a where a.id = auth.uid())
        )
        with check (
          bucket_id in ('videos', 'thumbnails')
          and exists (select 1 from public.admins a where a.id = auth.uid())
        )
      $sql$;
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects' and policyname = 'storage_objects_videos_delete_admin'
    ) then
      execute $sql$
        create policy storage_objects_videos_delete_admin on storage.objects
        for delete to authenticated
        using (
          bucket_id in ('videos', 'thumbnails')
          and exists (select 1 from public.admins a where a.id = auth.uid())
        )
      $sql$;
    end if;
  end if;
end $$;
