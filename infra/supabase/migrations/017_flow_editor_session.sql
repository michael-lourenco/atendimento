-- Palavras-chave do fluxo e pilha de retorno do goToFlow

alter table public.flows
  add column if not exists keywords jsonb not null default '[]'::jsonb;

alter table public.flow_sessions
  add column if not exists return_stack jsonb not null default '[]'::jsonb;
