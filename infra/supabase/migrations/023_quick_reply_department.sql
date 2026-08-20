-- Setor opcional nas respostas rápidas (vazio = todos os setores).

alter table public.quick_replies
  add column if not exists department_id text;
