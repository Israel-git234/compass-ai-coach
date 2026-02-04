-- Coaching Sessions: Focused coaching sessions with goals and takeaways

create table if not exists public.coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  goal text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  takeaway text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.coaching_sessions enable row level security;

drop policy if exists "coaching_sessions_select_own" on public.coaching_sessions;
create policy "coaching_sessions_select_own"
  on public.coaching_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "coaching_sessions_insert_own" on public.coaching_sessions;
create policy "coaching_sessions_insert_own"
  on public.coaching_sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "coaching_sessions_update_own" on public.coaching_sessions;
create policy "coaching_sessions_update_own"
  on public.coaching_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_coaching_sessions_user_id
  on public.coaching_sessions (user_id);

create index if not exists idx_coaching_sessions_status
  on public.coaching_sessions (user_id, status);
