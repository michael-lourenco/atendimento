-- Snapshot da última mensagem para a prévia da inbox.

alter table public.conversations
  add column if not exists last_message jsonb;
