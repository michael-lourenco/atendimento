-- Áudio pré-gravado nas respostas rápidas.

alter table public.quick_replies
  add column if not exists media_kind text;
