-- ================================================================
-- RomeoFlexVision — Initial Schema
-- Run in: Supabase Dashboard > SQL Editor
-- ================================================================

-- ---- Tasks ----
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  agent_id    text not null default 'orchestrator',
  status      text not null default 'queued'
                check (status in ('queued','running','completed','error','waiting_human')),
  progress    int  not null default 0 check (progress between 0 and 100),
  result      jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- ---- Agent usage (FinOps) ----
create table if not exists public.agent_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  task_id     uuid references public.tasks(id) on delete cascade,
  agent_id    text not null,
  tokens_in   int  not null default 0,
  tokens_out  int  not null default 0,
  tokens_cached int not null default 0,
  cost_usd    numeric(10,6) not null default 0,
  recorded_at timestamptz not null default now()
);

-- ---- Row Level Security ----
alter table public.tasks       enable row level security;
alter table public.agent_usage enable row level security;

-- users only see their own rows
create policy "tasks: own rows"       on public.tasks       for all using (auth.uid() = user_id);
create policy "agent_usage: own rows" on public.agent_usage for all using (auth.uid() = user_id);

-- ---- Realtime ----
alter publication supabase_realtime add table public.tasks;
