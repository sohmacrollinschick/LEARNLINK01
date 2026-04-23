-- LearnLink: extend user_preferences with richer settings options

alter table public.user_preferences
add column if not exists email_notifications boolean not null default true;

alter table public.user_preferences
add column if not exists theme text not null default 'system'
check (theme in ('system', 'light', 'dark'));

alter table public.user_preferences
add column if not exists content_language text not null default 'english'
check (content_language in ('english', 'french'));

alter table public.user_preferences
add column if not exists compact_mode boolean not null default false;
