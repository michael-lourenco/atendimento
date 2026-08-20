-- Citação de mensagem e indicador de digitação do contato.

alter table public.messages
  add column if not exists quoted_message_id text;

alter table public.messages
  add column if not exists quoted_content text;

alter table public.messages
  add column if not exists quoted_from text;

alter table public.conversations
  add column if not exists contact_typing_at timestamptz;
