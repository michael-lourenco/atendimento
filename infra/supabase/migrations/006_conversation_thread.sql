-- Thread por contato + linha: o mesmo telefone em duas linhas não compartilha id.
-- Inclui a coluna se a 005 ainda não tiver rodado.

alter table public.whatsapp_numbers
  add column if not exists instance_name text;

alter table public.conversations
  add column if not exists whatsapp_number_id text;

create unique index if not exists conversations_phone_line_uidx
  on public.conversations (contact_phone, whatsapp_number_id)
  where whatsapp_number_id is not null;
