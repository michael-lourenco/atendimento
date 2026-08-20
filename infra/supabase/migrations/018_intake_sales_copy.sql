-- Textos de venda do seed (espelha core/entities/atendimentoInicialFlow.ts).
-- Comercial, demo e ajuda do cliente usam handoff para o bot parar.

insert into public.flows (id, name, description, is_active, steps, updated_at)
values
(
  'inicio',
  'Atendimento Inicial',
  'Menu de entrada. Os ramos saltam para sistema, demo, cliente e comercial.',
  true,
  $inicio$[
    {"id":"welcome","type":"message","content":"Oi, aqui é o Michael. Este WhatsApp é o produto: o bot recebe, organiza e o time responde no computador.","nextStepId":"menu"},
    {"id":"menu","type":"question","content":"Como posso te ajudar?","options":["Quero o sistema para minha empresa","Quero uma demonstração","Já sou cliente","Falar com uma pessoa"],"nextStepId":"c_sistema"},
    {"id":"c_sistema","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"sistema","trueStepId":"to_sistema","falseStepId":"c_demo"}},
    {"id":"c_demo","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"demo","trueStepId":"to_demo","falseStepId":"c_cliente"}},
    {"id":"c_cliente","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"cliente","trueStepId":"to_cliente","falseStepId":"c_pessoa"}},
    {"id":"c_pessoa","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"pessoa","trueStepId":"to_comercial","falseStepId":"miss"}},
    {"id":"to_sistema","type":"action","content":"","action":{"type":"goToFlow","flowId":"sistema"}},
    {"id":"to_demo","type":"action","content":"","action":{"type":"goToFlow","flowId":"demo"}},
    {"id":"to_cliente","type":"action","content":"","action":{"type":"goToFlow","flowId":"cliente"}},
    {"id":"to_comercial","type":"action","content":"","action":{"type":"goToFlow","flowId":"comercial"}},
    {"id":"miss","type":"message","content":"Não peguei essa opção. Responda com o número (1, 2 ou 3) ou com o texto da linha, tipo: sistema, demonstração, cliente ou pessoa.","nextStepId":"menu"}
  ]$inicio$::jsonb,
  now()
),
(
  'sistema',
  'Sistema para empresa',
  'Tamanho do time, como funciona e próximo passo (valores, demo ou comercial).',
  true,
  $sistema$[
    {"id":"ask_size","type":"question","content":"Quantas pessoas da sua equipe vão atender pelo painel?","options":["1 atendente","2 a 5 atendentes","6 ou mais"],"nextStepId":"c_size6"},
    {"id":"c_size6","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"6","trueStepId":"pitch","falseStepId":"c_size2"}},
    {"id":"c_size2","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"2","trueStepId":"pitch","falseStepId":"c_size1"}},
    {"id":"c_size1","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"1","trueStepId":"pitch","falseStepId":"miss_size"}},
    {"id":"pitch","type":"message","content":"Isso encaixa no seu time. O bot faz a triagem, a conversa cai no setor certo e o atendente assume no computador. Fila, histórico e roteiro ficam no mesmo lugar, sem ficar preso no celular.","nextStepId":"ask_next"},
    {"id":"ask_next","type":"question","content":"O que você prefere agora?","options":["Ver valores e prazo","Agendar demo no computador","Quero contratar"],"nextStepId":"c_valor"},
    {"id":"c_valor","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"valor","trueStepId":"msg_preco","falseStepId":"c_computador"}},
    {"id":"c_computador","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"computador","trueStepId":"to_demo","falseStepId":"c_contratar"}},
    {"id":"c_contratar","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"contratar","trueStepId":"to_comercial","falseStepId":"miss_next"}},
    {"id":"msg_preco","type":"message","content":"Valores e prazo combinamos juntos, conforme o tamanho do time. Posso te passar para o comercial nesta conversa.","nextStepId":"ask_after"},
    {"id":"ask_after","type":"question","content":"Como você quer seguir?","options":["Agendar conversa","Só estou pesquisando"],"nextStepId":"c_agendar"},
    {"id":"c_agendar","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"agendar","trueStepId":"to_comercial_after","falseStepId":"c_pesquis"}},
    {"id":"c_pesquis","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"pesquis","trueStepId":"msg_frio","falseStepId":"miss_after"}},
    {"id":"msg_frio","type":"message","content":"Sem problema. Quando quiser avançar, é só chamar de novo. Se preferir, deixa seu nome e cidade aqui que eu guardo."},
    {"id":"to_demo","type":"action","content":"","action":{"type":"goToFlow","flowId":"demo"}},
    {"id":"to_comercial","type":"action","content":"","action":{"type":"goToFlow","flowId":"comercial"}},
    {"id":"to_comercial_after","type":"action","content":"","action":{"type":"goToFlow","flowId":"comercial"}},
    {"id":"miss_size","type":"message","content":"Não peguei essa opção. Responda com o número (1, 2 ou 3) ou com o texto da linha, tipo: 1 atendente, 2 a 5 ou 6.","nextStepId":"ask_size"},
    {"id":"miss_next","type":"message","content":"Não peguei essa opção. Responda com o número (1, 2 ou 3) ou com o texto da linha, tipo: valores, demo ou contratar.","nextStepId":"ask_next"},
    {"id":"miss_after","type":"message","content":"Não peguei essa opção. Responda com o número (1, 2 ou 3) ou com o texto da linha, tipo: agendar ou pesquisar.","nextStepId":"ask_after"}
  ]$sistema$::jsonb,
  now()
),
(
  'demo',
  'Demonstração',
  'Pausa o bot e chama o setor Demonstração.',
  true,
  $demo$[
    {"id":"msg_demo","type":"action","content":"Vamos marcar uma demonstração ao vivo no computador. Me envia um dia e um horário, tipo quinta 14h. Aí eu te mostro o painel funcionando nesta conversa.","action":{"type":"handoff","departmentId":"2"}}
  ]$demo$::jsonb,
  now()
),
(
  'cliente',
  'Já sou cliente',
  'Tira dúvida do painel ou chama o setor Cliente.',
  true,
  $cliente$[
    {"id":"faq","type":"question","content":"Sobre o que você precisa?","options":["Como o painel funciona","Preciso de ajuda agora"],"nextStepId":"c_faq_painel"},
    {"id":"c_faq_painel","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"painel","trueStepId":"msg_faq","falseStepId":"c_faq_ajuda"}},
    {"id":"c_faq_ajuda","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"ajuda","trueStepId":"msg_cliente","falseStepId":"miss"}},
    {"id":"msg_faq","type":"message","content":"No computador você vê todas as conversas, assume quando quiser e o bot para de responder sozinho. O roteiro do WhatsApp fica em Fluxos. Se ainda precisar de alguém, é só pedir.","nextStepId":"ask_more"},
    {"id":"ask_more","type":"question","content":"Quer falar com o time agora?","options":["Era só isso, obrigado","Preciso de ajuda agora"],"nextStepId":"c_more_ajuda"},
    {"id":"c_more_ajuda","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"ajuda","trueStepId":"msg_cliente","falseStepId":"c_more_ok"}},
    {"id":"c_more_ok","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"obrigado","trueStepId":"msg_ok","falseStepId":"miss_more"}},
    {"id":"msg_ok","type":"message","content":"Combinado. Qualquer coisa é só chamar."},
    {"id":"msg_cliente","type":"action","content":"Passei você para o time de clientes. Enquanto alguém assume, descreve o que está acontecendo.","action":{"type":"handoff","departmentId":"3"}},
    {"id":"miss","type":"message","content":"Não peguei essa opção. Responda com o número (1, 2 ou 3) ou com o texto da linha, tipo: painel ou ajuda.","nextStepId":"faq"},
    {"id":"miss_more","type":"message","content":"Não peguei essa opção. Responda com o número (1, 2 ou 3) ou com o texto da linha, tipo: obrigado ou ajuda.","nextStepId":"ask_more"}
  ]$cliente$::jsonb,
  now()
),
(
  'comercial',
  'Falar com o comercial',
  'Pausa o bot e chama o setor Comercial.',
  true,
  $comercial$[
    {"id":"msg_humano","type":"action","content":"Pronto, chamei o comercial. Alguém assume esta conversa daqui a pouco. Pode ir escrevendo o que você precisa.","action":{"type":"handoff","departmentId":"1"}}
  ]$comercial$::jsonb,
  now()
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  steps = excluded.steps,
  updated_at = now();
