-- Ritmo e silêncio do bot (Chatbot.behavior).

alter table public.chatbots
  add column if not exists behavior jsonb;
