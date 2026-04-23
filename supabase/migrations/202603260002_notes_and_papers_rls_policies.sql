-- LearnLink: RLS policies for study notes and past papers uploads
-- Covers table public.study_notes and storage buckets lesson-notes / GCE-PAPERS

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
  if to_regclass('public.study_notes') is not null then
    execute 'alter table public.study_notes enable row level security';

    execute 'drop policy if exists study_notes_select_authenticated on public.study_notes';
    execute 'drop policy if exists study_notes_insert_admin on public.study_notes';
    execute 'drop policy if exists study_notes_update_admin on public.study_notes';
    execute 'drop policy if exists study_notes_delete_admin on public.study_notes';

    execute 'create policy study_notes_select_authenticated on public.study_notes for select to authenticated using (true)';
    execute 'create policy study_notes_insert_admin on public.study_notes for insert to authenticated with check (public.is_admin(auth.uid()))';
    execute 'create policy study_notes_update_admin on public.study_notes for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))';
    execute 'create policy study_notes_delete_admin on public.study_notes for delete to authenticated using (public.is_admin(auth.uid()))';
  end if;
end $$;

do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists storage_objects_notes_papers_select_authenticated on storage.objects';
    execute 'drop policy if exists storage_objects_notes_papers_insert_admin on storage.objects';
    execute 'drop policy if exists storage_objects_notes_papers_update_admin on storage.objects';
    execute 'drop policy if exists storage_objects_notes_papers_delete_admin on storage.objects';

    execute $sql$
      create policy storage_objects_notes_papers_select_authenticated on storage.objects
      for select to authenticated
      using (bucket_id in ('lesson-notes', 'GCE-PAPERS'))
    $sql$;

    execute $sql$
      create policy storage_objects_notes_papers_insert_admin on storage.objects
      for insert to authenticated
      with check (
        bucket_id in ('lesson-notes', 'GCE-PAPERS')
        and public.is_admin(auth.uid())
      )
    $sql$;

    execute $sql$
      create policy storage_objects_notes_papers_update_admin on storage.objects
      for update to authenticated
      using (
        bucket_id in ('lesson-notes', 'GCE-PAPERS')
        and public.is_admin(auth.uid())
      )
      with check (
        bucket_id in ('lesson-notes', 'GCE-PAPERS')
        and public.is_admin(auth.uid())
      )
    $sql$;

    execute $sql$
      create policy storage_objects_notes_papers_delete_admin on storage.objects
      for delete to authenticated
      using (
        bucket_id in ('lesson-notes', 'GCE-PAPERS')
        and public.is_admin(auth.uid())
      )
    $sql$;
  end if;
end $$;
