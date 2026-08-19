-- Respostas rápidas da empresa (catálogo compartilhado).

create table if not exists public.quick_replies (
  id text primary key,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

alter table public.quick_replies enable row level security;

drop policy if exists authenticated_all on public.quick_replies;
create policy authenticated_all on public.quick_replies
  for all to authenticated
  using (true)
  with check (true);

grant all on table public.quick_replies to anon, authenticated, service_role;
