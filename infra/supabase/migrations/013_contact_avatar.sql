alter table public.contacts
  add column if not exists avatar_url text;

alter table public.conversations
  add column if not exists contact_avatar_url text;
