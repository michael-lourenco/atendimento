-- Depois de opção inválida, reapresenta o menu sem repetir o Olá.
-- Preserva a ordem dos passos (jsonb_agg ... order by ordinality).

update public.flows
set
  steps = (
    select jsonb_agg(
      case
        when step->>'id' = 'miss' then step || '{"nextStepId":"menu"}'::jsonb
        else step
      end
      order by ord
    )
    from jsonb_array_elements(steps) with ordinality as t(step, ord)
  ),
  updated_at = now()
where id = 'inicio';
