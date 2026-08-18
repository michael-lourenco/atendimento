-- Fase 4: schema inicial chatbot-atimo (Supabase Postgres + RLS + Storage)

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create table public.flows (
  id text primary key,
  name text not null,
  description text,
  steps jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flow_sessions (
  contact_id text primary key,
  flow_id text not null references public.flows (id),
  current_step_id text,
  updated_at timestamptz not null default now()
);

create table public.messages (
  id text primary key,
  from_address text not null,
  to_address text not null,
  content text not null default '',
  type text not null,
  timestamp timestamptz not null default now(),
  flow_id text,
  step_id text,
  direction text not null,
  status text not null
);

create table public.conversations (
  id text primary key,
  contact_id text not null,
  contact_name text not null,
  contact_phone text not null,
  department_id text,
  department_name text,
  assigned_agent_id text,
  assigned_agent_name text,
  status text not null,
  unread_count integer not null default 0,
  last_activity timestamptz not null default now(),
  created_at timestamptz not null default now(),
  tags jsonb not null default '[]'::jsonb
);

create table public.departments (
  id text primary key,
  name text not null,
  description text,
  color text not null default '#3b82f6',
  is_active boolean not null default true,
  agents_count integer not null default 0,
  conversations_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.internal_messages (
  id text primary key,
  from_id text not null,
  from_name text not null,
  to_id text,
  to_name text,
  conversation_id text not null,
  content text not null,
  type text not null,
  timestamp timestamptz not null default now(),
  department_id text
);

create table public.chatbots (
  id text primary key,
  name text not null,
  description text,
  is_active boolean not null default true,
  flow_id text references public.flows (id),
  messages_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agents (
  id text primary key,
  name text not null,
  email text not null,
  status text not null default 'offline',
  department_id text,
  conversations_count integer not null default 0,
  response_time text not null default '—',
  created_at timestamptz not null default now()
);

create table public.contacts (
  id text primary key,
  name text not null,
  phone text not null,
  email text,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.whatsapp_numbers (
  id text primary key,
  name text not null,
  number text not null,
  status text not null default 'active',
  provider text not null,
  created_at timestamptz not null default now()
);

create table public.tags (
  id text primary key,
  name text not null,
  color text not null,
  contacts_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.scheduled_messages (
  id text primary key,
  contact text not null,
  message text not null,
  scheduled_date timestamptz not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.reports (
  id text primary key,
  title text not null,
  type text not null,
  period text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    'user'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.flows (id, name, description, steps, is_active)
values (
  'inicio',
  'Atendimento Inicial',
  'Fluxo de boas-vindas e triagem inicial',
  '[
    {"id":"step1","type":"message","content":"Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?","nextStepId":"step2"},
    {"id":"step2","type":"question","content":"Selecione uma opção:","options":["Suporte técnico","Vendas","Financeiro","Outros"],"nextStepId":"step3"},
    {"id":"step3","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"suporte","trueStepId":"step_suporte","falseStepId":"step_geral"}},
    {"id":"step_suporte","type":"message","content":"Você está no canal de suporte técnico. Descreva seu problema:"},
    {"id":"step_geral","type":"message","content":"Certo! Um atendente já vai te responder."}
  ]'::jsonb,
  true
) on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_admin on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

do $$
declare
  t text;
begin
  foreach t in array array[
    'flows','flow_sessions','messages','conversations','departments','internal_messages',
    'chatbots','agents','contacts','whatsapp_numbers','tags','scheduled_messages','reports'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy authenticated_all on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

create policy media_authenticated on storage.objects
  for all to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
