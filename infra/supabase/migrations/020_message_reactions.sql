alter table public.messages
  add column if not exists reactions jsonb not null default '[]'::jsonb;
