-- Excluir fluxo: sessões e chatbots não bloqueiam o DELETE.

alter table public.flow_sessions
  drop constraint if exists flow_sessions_flow_id_fkey;

alter table public.flow_sessions
  add constraint flow_sessions_flow_id_fkey
  foreign key (flow_id) references public.flows (id) on delete cascade;

alter table public.chatbots
  drop constraint if exists chatbots_flow_id_fkey;

alter table public.chatbots
  add constraint chatbots_flow_id_fkey
  foreign key (flow_id) references public.flows (id) on delete set null;
