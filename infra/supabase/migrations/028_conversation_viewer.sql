-- Quem está com a conversa aberta no painel.

alter table public.conversations
  add column if not exists viewer_agent_id text;

alter table public.conversations
  add column if not exists viewer_agent_name text;

alter table public.conversations
  add column if not exists viewer_at timestamptz;
