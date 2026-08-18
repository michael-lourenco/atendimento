-- Pausa do chatbot quando o operador responde pelo painel

alter table public.flow_sessions
  add column if not exists paused boolean not null default false;
