-- Parte o atendimento inicial: menu em `inicio`; ramos em fluxos ativos ligados por goToFlow.
-- Espelha core/entities/atendimentoInicialFlow.ts (salesIntakeFlows).

insert into public.flows (id, name, description, is_active, steps, updated_at)
values
(
  'inicio',
  'Atendimento Inicial',
  'Menu de entrada. Os ramos saltam para fluxos menores (sistema, demo, cliente, comercial).',
  true,
  $inicio$[
    {"id":"welcome","type":"message","content":"Olá! Aqui é o atendimento automático do Michael: chatbot + painel para o time responder WhatsApp no computador, com triagem por setor.","nextStepId":"menu"},
    {"id":"menu","type":"question","content":"Como posso ajudar?","options":["Quero o sistema para minha empresa","Quero uma demonstração","Já sou cliente","Falar com uma pessoa"],"nextStepId":"c_sistema"},
    {"id":"c_sistema","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"sistema","trueStepId":"to_sistema","falseStepId":"c_demo"}},
    {"id":"c_demo","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"demo","trueStepId":"to_demo","falseStepId":"c_cliente"}},
    {"id":"c_cliente","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"cliente","trueStepId":"to_cliente","falseStepId":"c_pessoa"}},
    {"id":"c_pessoa","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"pessoa","trueStepId":"to_comercial","falseStepId":"miss"}},
    {"id":"to_sistema","type":"action","content":"","action":{"type":"goToFlow","flowId":"sistema"}},
    {"id":"to_demo","type":"action","content":"","action":{"type":"goToFlow","flowId":"demo"}},
    {"id":"to_cliente","type":"action","content":"","action":{"type":"goToFlow","flowId":"cliente"}},
    {"id":"to_comercial","type":"action","content":"","action":{"type":"goToFlow","flowId":"comercial"}},
    {"id":"miss","type":"message","content":"Não identifiquei essa opção. Envie o número da linha (1, 2, 3…) ou o texto (ou parte dele), por exemplo: sistema, demonstração, cliente ou pessoa.","nextStepId":"menu"}
  ]$inicio$::jsonb,
  now()
),
(
  'sistema',
  'Sistema para empresa',
  'Tamanho do time, pitch e próximo passo (valores, demo ou comercial).',
  true,
  $sistema$[
    {"id":"ask_size","type":"question","content":"Perfeito. Quantas pessoas vão atender no painel?","options":["1 atendente","2 a 5 atendentes","6 ou mais"],"nextStepId":"c_size6"},
    {"id":"c_size6","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"6","trueStepId":"pitch","falseStepId":"c_size2"}},
    {"id":"c_size2","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"2","trueStepId":"pitch","falseStepId":"c_size1"}},
    {"id":"c_size1","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"1","trueStepId":"pitch","falseStepId":"miss_size"}},
    {"id":"pitch","type":"message","content":"Cabe no seu caso: o bot filtra, a conversa cai no setor certo e o atendente assume no computador. Fluxos, fila e histórico no mesmo painel — sem depender do WhatsApp Web.","nextStepId":"ask_next"},
    {"id":"ask_next","type":"question","content":"Qual o próximo passo?","options":["Ver valores e prazo","Agendar demo no computador","Quero contratar"],"nextStepId":"c_valor"},
    {"id":"c_valor","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"valor","trueStepId":"msg_preco","falseStepId":"c_computador"}},
    {"id":"c_computador","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"computador","trueStepId":"to_demo","falseStepId":"c_contratar"}},
    {"id":"c_contratar","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"contratar","trueStepId":"to_comercial","falseStepId":"miss_next"}},
    {"id":"msg_preco","type":"message","content":"Implantação para PME, com o painel que você está usando agora. Valores e prazo fechamos na conversa — sem número genérico. Posso te colocar na fila comercial.","nextStepId":"ask_after"},
    {"id":"ask_after","type":"question","content":"Como prefere seguir?","options":["Agendar conversa","Só estou pesquisando"],"nextStepId":"c_agendar"},
    {"id":"c_agendar","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"agendar","trueStepId":"to_comercial_after","falseStepId":"c_pesquis"}},
    {"id":"c_pesquis","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"pesquis","trueStepId":"msg_frio","falseStepId":"miss_after"}},
    {"id":"msg_frio","type":"message","content":"Tudo bem. Quando quiser, é só chamar de novo e escolher uma opção. Se preferir, deixe seu nome e cidade nesta conversa."},
    {"id":"to_demo","type":"action","content":"","action":{"type":"goToFlow","flowId":"demo"}},
    {"id":"to_comercial","type":"action","content":"","action":{"type":"goToFlow","flowId":"comercial"}},
    {"id":"to_comercial_after","type":"action","content":"","action":{"type":"goToFlow","flowId":"comercial"}},
    {"id":"miss_size","type":"message","content":"Não identifiquei essa opção. Envie o número da linha (1, 2, 3…) ou o texto (ou parte dele), por exemplo: 1 atendente, 2 a 5 ou 6.","nextStepId":"ask_size"},
    {"id":"miss_next","type":"message","content":"Não identifiquei essa opção. Envie o número da linha (1, 2, 3…) ou o texto (ou parte dele), por exemplo: valores, demo ou contratar.","nextStepId":"ask_next"},
    {"id":"miss_after","type":"message","content":"Não identifiquei essa opção. Envie o número da linha (1, 2, 3…) ou o texto (ou parte dele), por exemplo: agendar ou pesquisar.","nextStepId":"ask_after"}
  ]$sistema$::jsonb,
  now()
),
(
  'demo',
  'Demonstração',
  'Define o setor Demonstração e pede dia e horário.',
  true,
  $demo$[
    {"id":"set_demo","type":"action","content":"","nextStepId":"msg_demo","action":{"type":"setDepartment","departmentId":"2"}},
    {"id":"msg_demo","type":"message","content":"A conversa foi para o setor Demonstração. Envie um dia e um horário (ex.: quinta 14h). Abrimos o painel com você: Assumir, setores e o fluxo ao vivo."}
  ]$demo$::jsonb,
  now()
),
(
  'cliente',
  'Já sou cliente',
  'FAQ do painel ou setor Cliente.',
  true,
  $cliente$[
    {"id":"faq","type":"question","content":"Sobre o que você precisa?","options":["Como o painel funciona","Preciso de ajuda agora"],"nextStepId":"c_faq_painel"},
    {"id":"c_faq_painel","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"painel","trueStepId":"msg_faq","falseStepId":"c_faq_ajuda"}},
    {"id":"c_faq_ajuda","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"ajuda","trueStepId":"set_cliente","falseStepId":"miss"}},
    {"id":"msg_faq","type":"message","content":"No painel: Conversas (Assumir, Transferir, Finalizar), Fluxos para o roteiro do WhatsApp, e WhatsApp só para o QR. Quando o atendente responde, o bot pausa. Se precisar de alguém, envie: Preciso de ajuda agora."},
    {"id":"set_cliente","type":"action","content":"","nextStepId":"msg_cliente","action":{"type":"setDepartment","departmentId":"3"}},
    {"id":"msg_cliente","type":"message","content":"Você está no setor Cliente. Um atendente assume esta conversa. Enquanto isso, descreva o que está acontecendo."},
    {"id":"miss","type":"message","content":"Não identifiquei essa opção. Envie o número da linha (1, 2, 3…) ou o texto (ou parte dele), por exemplo: painel ou ajuda.","nextStepId":"faq"}
  ]$cliente$::jsonb,
  now()
),
(
  'comercial',
  'Falar com o comercial',
  'Define o setor Comercial e avisa que um especialista assume.',
  true,
  $comercial$[
    {"id":"set_comercial","type":"action","content":"","nextStepId":"msg_humano","action":{"type":"setDepartment","departmentId":"1"}},
    {"id":"msg_humano","type":"message","content":"Encaminhei você ao comercial. Em instantes um especialista assume esta conversa no painel — o bot para aqui para não misturar com o atendimento humano."}
  ]$comercial$::jsonb,
  now()
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  steps = excluded.steps,
  updated_at = now();
