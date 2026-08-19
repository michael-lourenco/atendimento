-- Seed: setores, agentes, etiquetas e fluxo inicio de triagem comercial (saudação em nome do Michael).
-- Espelha core/entities/atendimentoInicialFlow.ts

insert into public.departments (id, name, description, color, is_active, agents_count, conversations_count)
values
  ('1', 'Comercial', 'Leads prontos para conversa e fechamento', '#16a34a', true, 1, 0),
  ('2', 'Demonstração', 'Quem quer ver o painel no computador', '#2563eb', true, 1, 0),
  ('3', 'Cliente', 'Quem já usa o sistema e precisa de suporte', '#d97706', true, 1, 0)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.agents (id, name, email, status, department_id, conversations_count, response_time)
values
  ('1', 'Michael', 'michael@atimo.local', 'online', '1', 0, '—'),
  ('2', 'Atendente', 'atendente@atimo.local', 'online', '2', 0, '—')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  status = excluded.status,
  department_id = excluded.department_id,
  response_time = excluded.response_time;

insert into public.tags (id, name, color, contacts_count)
values
  ('lead', 'lead', '#2563eb', 0),
  ('demo', 'demo', '#7c3aed', 0),
  ('proposta', 'proposta', '#d97706', 0),
  ('cliente', 'cliente', '#16a34a', 0)
on conflict (id) do update set
  name = excluded.name,
  color = excluded.color;

insert into public.chatbots (id, name, description, is_active, flow_id, messages_count)
values (
  '1',
  'Atendimento Inicial',
  'Roteiro de triagem no WhatsApp (fluxo inicio)',
  true,
  'inicio',
  0
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  flow_id = excluded.flow_id;

update public.flows
set
  name = 'Atendimento Inicial',
  description = 'Triagem comercial: sistema, demo, cliente e humano. Setor antes de encerrar o ramo.',
  is_active = true,
  updated_at = now(),
  steps = $steps$[
    {"id":"welcome","type":"message","content":"Olá! Aqui é o atendimento automático do Michael: chatbot + painel para o time responder WhatsApp no computador, com triagem por setor.","nextStepId":"menu"},
    {"id":"menu","type":"question","content":"Como posso ajudar?","options":["Quero o sistema para minha empresa","Quero uma demonstração","Já sou cliente","Falar com uma pessoa"],"nextStepId":"c_sistema"},
    {"id":"c_sistema","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"sistema","trueStepId":"ask_size","falseStepId":"c_demo"}},
    {"id":"c_demo","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"demo","trueStepId":"set_demo","falseStepId":"c_cliente"}},
    {"id":"c_cliente","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"cliente","trueStepId":"faq","falseStepId":"c_pessoa"}},
    {"id":"c_pessoa","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"pessoa","trueStepId":"set_comercial","falseStepId":"miss"}},
    {"id":"ask_size","type":"question","content":"Perfeito. Quantas pessoas vão atender no painel?","options":["1 atendente","2 a 5 atendentes","6 ou mais"],"nextStepId":"c_size6"},
    {"id":"c_size6","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"6","trueStepId":"pitch","falseStepId":"c_size2"}},
    {"id":"c_size2","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"2","trueStepId":"pitch","falseStepId":"c_size1"}},
    {"id":"c_size1","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"1","trueStepId":"pitch","falseStepId":"miss"}},
    {"id":"pitch","type":"message","content":"Cabe no seu caso: o bot filtra, a conversa cai no setor certo e o atendente assume no computador. Fluxos, fila e histórico no mesmo painel — sem depender do WhatsApp Web.","nextStepId":"ask_next"},
    {"id":"ask_next","type":"question","content":"Qual o próximo passo?","options":["Ver valores e prazo","Agendar demo no computador","Quero contratar"],"nextStepId":"c_valor"},
    {"id":"c_valor","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"valor","trueStepId":"msg_preco","falseStepId":"c_computador"}},
    {"id":"c_computador","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"computador","trueStepId":"set_demo","falseStepId":"c_contratar"}},
    {"id":"c_contratar","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"contratar","trueStepId":"set_comercial","falseStepId":"miss"}},
    {"id":"msg_preco","type":"message","content":"Implantação para PME, com o painel que você está usando agora. Valores e prazo fechamos na conversa — sem número genérico. Posso te colocar na fila comercial.","nextStepId":"ask_after"},
    {"id":"ask_after","type":"question","content":"Como prefere seguir?","options":["Agendar conversa","Só estou pesquisando"],"nextStepId":"c_agendar"},
    {"id":"c_agendar","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"agendar","trueStepId":"set_comercial","falseStepId":"c_pesquis"}},
    {"id":"c_pesquis","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"pesquis","trueStepId":"msg_frio","falseStepId":"miss"}},
    {"id":"faq","type":"question","content":"Sobre o que você precisa?","options":["Como o painel funciona","Preciso de ajuda agora"],"nextStepId":"c_faq_painel"},
    {"id":"c_faq_painel","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"painel","trueStepId":"msg_faq","falseStepId":"c_faq_ajuda"}},
    {"id":"c_faq_ajuda","type":"condition","content":"","condition":{"field":"content","operator":"contains","value":"ajuda","trueStepId":"set_cliente","falseStepId":"miss"}},
    {"id":"set_comercial","type":"action","content":"","nextStepId":"msg_humano","action":{"type":"setDepartment","departmentId":"1"}},
    {"id":"set_demo","type":"action","content":"","nextStepId":"msg_demo","action":{"type":"setDepartment","departmentId":"2"}},
    {"id":"set_cliente","type":"action","content":"","nextStepId":"msg_cliente","action":{"type":"setDepartment","departmentId":"3"}},
    {"id":"msg_humano","type":"message","content":"Encaminhei você ao comercial. Em instantes um especialista assume esta conversa no painel — o bot para aqui para não misturar com o atendimento humano."},
    {"id":"msg_demo","type":"message","content":"A conversa foi para o setor Demonstração. Envie um dia e um horário (ex.: quinta 14h). Abrimos o painel com você: Assumir, setores e o fluxo ao vivo."},
    {"id":"msg_cliente","type":"message","content":"Você está no setor Cliente. Um atendente assume esta conversa. Enquanto isso, descreva o que está acontecendo."},
    {"id":"msg_faq","type":"message","content":"No painel: Conversas (Assumir, Transferir, Finalizar), Fluxos para o roteiro do WhatsApp, e WhatsApp só para o QR. Quando o atendente responde, o bot pausa. Se precisar de alguém, envie: Preciso de ajuda agora."},
    {"id":"msg_frio","type":"message","content":"Tudo bem. Quando quiser, é só chamar de novo e escolher uma opção. Se preferir, deixe seu nome e cidade nesta conversa."},
    {"id":"miss","type":"message","content":"Não identifiquei essa opção. Envie o texto de uma das linhas (ou parte dele), por exemplo: sistema, demonstração, cliente ou pessoa.","nextStepId":"menu"}
  ]$steps$::jsonb
where id = 'inicio';
