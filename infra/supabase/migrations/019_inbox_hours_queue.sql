-- Expediente, fila/assumir, Realtime da inbox e pausa na saudação do seed.

alter table public.conversations
  add column if not exists assigned_at timestamptz;

alter table public.chatbots
  add column if not exists business_hours jsonb;

alter table public.flow_sessions
  add column if not exists outside_hours_notified boolean not null default false;

update public.flows
set
  steps = (
    select jsonb_agg(
      case
        when step->>'id' = 'welcome' then jsonb_set(step, '{delayMs}', '600')
        when step->>'id' = 'menu' then jsonb_set(step, '{delayMs}', '400')
        else step
      end
      order by ord
    )
    from jsonb_array_elements(steps) with ordinality as t(step, ord)
  ),
  updated_at = now()
where id = 'inicio';

alter table public.conversations replica identity full;
alter table public.messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
