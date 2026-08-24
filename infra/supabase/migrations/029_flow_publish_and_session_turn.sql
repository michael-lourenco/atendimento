alter table public.flows
  add column if not exists published_steps jsonb;

alter table public.flow_sessions
  add column if not exists consumed_incoming_at timestamptz,
  add column if not exists miss_streak integer not null default 0,
  add column if not exists media_hint_step_id text;

notify pgrst, 'reload schema';
