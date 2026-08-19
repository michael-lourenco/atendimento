-- E-mail de agente único (case-insensitive). Colapsa duplicatas e impede o trigger de criar outra linha.

drop table if exists public._tmp_agent_email_dupes;

create table public._tmp_agent_email_dupes (
  drop_id text primary key,
  keep_id text not null
);

insert into public._tmp_agent_email_dupes (drop_id, keep_id)
with ranked as (
  select
    a.id,
    a.email,
    row_number() over (
      partition by lower(trim(a.email))
      order by
        case
          when exists (
            select 1
            from public.profiles p
            where p.id::text = a.id
              and lower(trim(p.email)) = lower(trim(a.email))
          ) then 0
          else 1
        end,
        a.created_at asc,
        a.id asc
    ) as rn
  from public.agents a
  where trim(a.email) <> ''
)
select loser.id, keeper.id
from ranked loser
join ranked keeper
  on lower(trim(keeper.email)) = lower(trim(loser.email))
  and keeper.rn = 1
where loser.rn > 1;

update public.conversations c
set assigned_agent_id = d.keep_id
from public._tmp_agent_email_dupes d
where c.assigned_agent_id = d.drop_id;

update public.agents keep
set
  department_id = coalesce(keep.department_id, drop.department_id),
  conversations_count = keep.conversations_count + drop.conversations_count
from public._tmp_agent_email_dupes d
join public.agents drop on drop.id = d.drop_id
where keep.id = d.keep_id;

delete from public.agents a
using public._tmp_agent_email_dupes d
where a.id = d.drop_id;

drop table if exists public._tmp_agent_email_dupes;

create unique index if not exists agents_email_lower_uidx
  on public.agents (lower(trim(email)))
  where trim(email) <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role text;
  new_name text;
  new_email text;
begin
  new_role := case
    when exists (select 1 from public.profiles where role = 'admin') then 'user'
    else 'admin'
  end;
  new_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, ''), '@', 1)
  );
  new_email := coalesce(new.email, '');
  insert into public.profiles (id, email, name, role)
  values (new.id, new_email, new_name, new_role);
  if trim(new_email) = '' or not exists (
    select 1
    from public.agents a
    where lower(trim(a.email)) = lower(trim(new_email))
  ) then
    insert into public.agents (id, name, email, status, conversations_count, response_time)
    values (new.id::text, new_name, new_email, 'online', 0, '—')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
