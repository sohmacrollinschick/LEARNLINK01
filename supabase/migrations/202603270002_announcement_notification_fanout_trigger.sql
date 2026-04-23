-- LearnLink: ensure every published announcement creates recipient notifications

create or replace function public.fanout_announcement_notifications()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (user_id, title, message, type, is_read)
  select
    p.id,
    new.title,
    new.message,
    'announcement',
    false
  from public.profiles p
  where new.target = 'all'
    or p.role = new.target;

  return new;
end;
$$;

drop trigger if exists trg_fanout_announcement_notifications on public.announcements;
create trigger trg_fanout_announcement_notifications
after insert on public.announcements
for each row
execute function public.fanout_announcement_notifications();
