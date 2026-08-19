-- Linhas WhatsApp em paralelo na mesma empresa.

alter table public.whatsapp_numbers
  add column if not exists instance_name text;

alter table public.conversations
  add column if not exists whatsapp_number_id text;
