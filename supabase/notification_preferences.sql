-- Per-user notification preferences for AI News Live.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> Run.

create table if not exists public.notification_preferences (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  enabled    boolean not null default false,
  categories text[]  not null default '{LLM,Robotics,Ethics,General}',
  sources    text[]  not null default '{blog,community,research,news}',
  keywords   text[]  not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

-- Each user can only see and change their own row.
create policy "own prefs: select" on public.notification_preferences
  for select using (auth.uid() = user_id);

create policy "own prefs: insert" on public.notification_preferences
  for insert with check (auth.uid() = user_id);

create policy "own prefs: update" on public.notification_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
