-- Saudação do fluxo inicio em nome do Michael (não Atimo).
-- Preserva a ordem dos passos.

update public.flows
set
  steps = (
    select jsonb_agg(
      case
        when step->>'id' = 'welcome' then jsonb_set(
          step,
          '{content}',
          to_jsonb(
            'Olá! Aqui é o atendimento automático do Michael: chatbot + painel para o time responder WhatsApp no computador, com triagem por setor.'::text
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
