-- Perfil nasce como agente; o primeiro usuário é admin.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role text;
  new_name text;
begin
  new_role := case
    when exists (select 1 from public.profiles where role = 'admin') then 'user'
    else 'admin'
  end;
  new_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, ''), '@', 1)
  );
  insert into public.profiles (id, email, name, role)
  values (new.id, coalesce(new.email, ''), new_name, new_role);
  insert into public.agents (id, name, email, status, conversations_count, response_time)
  values (new.id::text, new_name, coalesce(new.email, ''), 'online', 0, '—')
  on conflict (id) do nothing;
  return new;
end;
$$;

insert into public.agents (id, name, email, status, conversations_count, response_time)
select p.id::text, p.name, p.email, 'online', 0, '—'
from public.profiles p
on conflict (id) do nothing;

update public.profiles
set role = 'admin'
where id = (
  select id from public.profiles order by created_at asc limit 1
)
and not exists (select 1 from public.profiles where role = 'admin');
