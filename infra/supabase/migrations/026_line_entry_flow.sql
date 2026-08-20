-- Fluxo de entrada por linha WhatsApp (WhatsAppNumber.flowId).

alter table public.whatsapp_numbers
  add column if not exists flow_id text references public.flows (id) on delete set null;
