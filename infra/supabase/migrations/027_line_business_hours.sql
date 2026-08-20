-- Expediente do bot por linha WhatsApp (WhatsAppNumber.businessHours).

alter table public.whatsapp_numbers
  add column if not exists business_hours jsonb;
