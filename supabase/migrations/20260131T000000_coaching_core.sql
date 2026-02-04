-- Compass coaching core schema: coaches, conversations, messages, memory, insights

-- Ensure pgcrypto is available for gen_random_uuid (usually enabled by default in Supabase)
create extension if not exists "pgcrypto";

-- 1) Coaches
create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  style text not null check (style in ('gentle','balanced','direct')),
  persona_key text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.coaches enable row level security;

drop policy if exists "coaches_read_all" on public.coaches;
create policy "coaches_read_all"
  on public.coaches
  for select
  using (true);

-- 2) Conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  coach_id uuid not null references public.coaches (id) on delete restrict,
  mode text not null default 'text' check (mode in ('text')),
  title text,
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  is_archived boolean not null default false
);

alter table public.conversations enable row level security;

drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own"
  on public.conversations
  for select
  using (auth.uid() = user_id);

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own"
  on public.conversations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "conversations_update_own" on public.conversations;
create policy "conversations_update_own"
  on public.conversations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_conversations_user_id
  on public.conversations (user_id);

-- 3) Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender text not null check (sender in ('user','coach')),
  type text not null default 'text' check (type in ('text')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
  on public.messages
  for insert
  with check (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own"
  on public.messages
  for update
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create index if not exists idx_messages_conversation_id_created_at
  on public.messages (conversation_id, created_at);

-- 4) Conversation memory
create table if not exists public.conversation_memory (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  summary text,
  themes jsonb,
  last_updated_at timestamptz not null default now()
);

alter table public.conversation_memory enable row level security;

drop policy if exists "conversation_memory_select_own" on public.conversation_memory;
create policy "conversation_memory_select_own"
  on public.conversation_memory
  for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_memory.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "conversation_memory_upsert_own" on public.conversation_memory;
create policy "conversation_memory_upsert_own"
  on public.conversation_memory
  for all
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_memory.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_memory.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- 5) Insights
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  themes jsonb,
  summary text not null,
  user_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.insights enable row level security;

drop policy if exists "insights_select_own" on public.insights;
create policy "insights_select_own"
  on public.insights
  for select
  using (auth.uid() = user_id);

drop policy if exists "insights_insert_own" on public.insights;
create policy "insights_insert_own"
  on public.insights
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "insights_update_own" on public.insights;
create policy "insights_update_own"
  on public.insights
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_insights_user_id_created_at
  on public.insights (user_id, created_at);

