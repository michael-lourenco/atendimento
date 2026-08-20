-- Ritmo do bot por linha WhatsApp (WhatsAppNumber.behavior).

alter table public.whatsapp_numbers
  add column if not exists behavior jsonb;
