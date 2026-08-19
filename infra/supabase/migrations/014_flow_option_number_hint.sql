-- Texto do miss: o cliente pode responder com o número da opção.

update public.flows
set
  steps = (
    select jsonb_agg(
      case
        when step->>'id' = 'miss' then jsonb_set(
          step,
          '{content}',
          to_jsonb(
            'Não identifiquei essa opção. Envie o número da linha (1, 2, 3…) ou o texto (ou parte dele), por exemplo: sistema, demonstração, cliente ou pessoa.'::text
          )
        )
        else step
      end
      order by ord
    )
    from jsonb_array_elements(steps) with ordinality as t(step, ord)
  ),
  updated_at = now()
where id = 'inicio';
