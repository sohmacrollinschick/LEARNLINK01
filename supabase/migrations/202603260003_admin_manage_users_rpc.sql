-- LearnLink: admin-safe profile listing for Manage Users page

create or replace function public.admin_list_profiles()
returns setof public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_admin(auth.uid()) then
    return query
    select *
    from public.profiles
    order by created_at desc nulls last;
  end if;

  -- Non-admin fallback: only own profile
  return query
  select *
  from public.profiles
  where id = auth.uid();
end;
$$;

grant execute on function public.admin_list_profiles() to authenticated, service_role;
