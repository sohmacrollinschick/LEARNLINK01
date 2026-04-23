-- LearnLink: allow admins to delete published announcements

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'announcements'
      and policyname = 'announcements_delete_admin'
  ) then
    create policy announcements_delete_admin
      on public.announcements
      for delete
      using (
        exists (
          select 1
          from public.admins a
          where a.id = auth.uid()
        )
      );
  end if;
end $$;
