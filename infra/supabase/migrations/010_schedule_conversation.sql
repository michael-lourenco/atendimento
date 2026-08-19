-- Thread da linha quando o agendamento nasce no chat.

alter table public.scheduled_messages
  add column if not exists conversation_id text;
