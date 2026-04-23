-- LearnLink: track student interactions for analytics/auditing

create table if not exists public.student_interactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'student',
  event_type text not null,
  page_path text null,
  target_type text null,
  target_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_student_interactions_user_created_at
  on public.student_interactions (user_id, created_at desc);

create index if not exists idx_student_interactions_event_type
  on public.student_interactions (event_type);

create index if not exists idx_student_interactions_created_at
  on public.student_interactions (created_at desc);

alter table public.student_interactions enable row level security;

drop policy if exists "students_insert_own_interactions" on public.student_interactions;
create policy "students_insert_own_interactions"
on public.student_interactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "students_select_own_interactions" on public.student_interactions;
create policy "students_select_own_interactions"
on public.student_interactions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "admins_select_all_student_interactions" on public.student_interactions;
create policy "admins_select_all_student_interactions"
on public.student_interactions
for select
to authenticated
using (public.is_admin(auth.uid()));
