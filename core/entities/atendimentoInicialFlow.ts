import { Flow, FlowStep } from './Flow';

export const INTAKE_DEPARTMENT_COMERCIAL = '1';
export const INTAKE_DEPARTMENT_DEMO = '2';
export const INTAKE_DEPARTMENT_CLIENTE = '3';

export const INTAKE_FLOW_INICIO = 'inicio';
export const INTAKE_FLOW_SISTEMA = 'sistema';
export const INTAKE_FLOW_DEMO = 'demo';
export const INTAKE_FLOW_CLIENTE = 'cliente';
export const INTAKE_FLOW_COMERCIAL = 'comercial';

function cond(id: string, value: string, trueStepId: string, falseStepId: string): FlowStep {
  return {
    id,
    type: 'condition',
    content: '',
    condition: {
      field: 'content',
      operator: 'contains',
      value,
      trueStepId,
      falseStepId,
    },
  };
}

function goto(id: string, flowId: string): FlowStep {
  return {
    id,
    type: 'action',
    content: '',
    action: { type: 'goToFlow', flowId },
  };
}

function miss(id: string, nextStepId: string, hint: string): FlowStep {
  return {
    id,
    type: 'message',
    content: `Não identifiquei essa opção. Envie o número da linha (1, 2, 3…) ou o texto (ou parte dele), por exemplo: ${hint}.`,
    nextStepId,
  };
}

function makeFlow(
  id: string,
  name: string,
  description: string,
  steps: FlowStep[],
  now: Date
): Flow {
  return { id, name, description, isActive: true, steps, createdAt: now, updatedAt: now };
}

function inicioFlow(now: Date): Flow {
  return makeFlow(
    INTAKE_FLOW_INICIO,
    'Atendimento Inicial',
    'Menu de entrada. Os ramos saltam para fluxos menores (sistema, demo, cliente, comercial).',
    [
      {
        id: 'welcome',
        type: 'message',
        content:
          'Olá! Aqui é o atendimento automático do Michael: chatbot + painel para o time responder WhatsApp no computador, com triagem por setor.',
        nextStepId: 'menu',
      },
      {
        id: 'menu',
        type: 'question',
        content: 'Como posso ajudar?',
        options: [
          'Quero o sistema para minha empresa',
          'Quero uma demonstração',
          'Já sou cliente',
          'Falar com uma pessoa',
        ],
        nextStepId: 'c_sistema',
      },
      cond('c_sistema', 'sistema', 'to_sistema', 'c_demo'),
      cond('c_demo', 'demo', 'to_demo', 'c_cliente'),
      cond('c_cliente', 'cliente', 'to_cliente', 'c_pessoa'),
      cond('c_pessoa', 'pessoa', 'to_comercial', 'miss'),
      goto('to_sistema', INTAKE_FLOW_SISTEMA),
      goto('to_demo', INTAKE_FLOW_DEMO),
      goto('to_cliente', INTAKE_FLOW_CLIENTE),
      goto('to_comercial', INTAKE_FLOW_COMERCIAL),
      miss('miss', 'menu', 'sistema, demonstração, cliente ou pessoa'),
    ],
    now
  );
}

function comercialFlow(now: Date): Flow {
  return makeFlow(
    INTAKE_FLOW_COMERCIAL,
    'Falar com o comercial',
    'Define o setor Comercial e avisa que um especialista assume.',
    [
      {
        id: 'set_comercial',
        type: 'action',
        content: '',
        nextStepId: 'msg_humano',
        action: { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_COMERCIAL },
      },
      {
        id: 'msg_humano',
        type: 'message',
        content:
          'Encaminhei você ao comercial. Em instantes um especialista assume esta conversa no painel — o bot para aqui para não misturar com o atendimento humano.',
      },
    ],
    now
  );
}

function demoFlow(now: Date): Flow {
  return makeFlow(
    INTAKE_FLOW_DEMO,
    'Demonstração',
    'Define o setor Demonstração e pede dia e horário.',
    [
      {
        id: 'set_demo',
        type: 'action',
        content: '',
        nextStepId: 'msg_demo',
        action: { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_DEMO },
      },
      {
        id: 'msg_demo',
        type: 'message',
        content:
          'A conversa foi para o setor Demonstração. Envie um dia e um horário (ex.: quinta 14h). Abrimos o painel com você: Assumir, setores e o fluxo ao vivo.',
      },
    ],
    now
  );
}

function clienteFlow(now: Date): Flow {
  return makeFlow(
    INTAKE_FLOW_CLIENTE,
    'Já sou cliente',
    'FAQ do painel ou setor Cliente.',
    [
      {
        id: 'faq',
        type: 'question',
        content: 'Sobre o que você precisa?',
        options: ['Como o painel funciona', 'Preciso de ajuda agora'],
        nextStepId: 'c_faq_painel',
      },
      cond('c_faq_painel', 'painel', 'msg_faq', 'c_faq_ajuda'),
      cond('c_faq_ajuda', 'ajuda', 'set_cliente', 'miss'),
      {
        id: 'msg_faq',
        type: 'message',
        content:
          'No painel: Conversas (Assumir, Transferir, Finalizar), Fluxos para o roteiro do WhatsApp, e WhatsApp só para o QR. Quando o atendente responde, o bot pausa. Se precisar de alguém, envie: Preciso de ajuda agora.',
      },
      {
        id: 'set_cliente',
        type: 'action',
        content: '',
        nextStepId: 'msg_cliente',
        action: { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_CLIENTE },
      },
      {
        id: 'msg_cliente',
        type: 'message',
        content:
          'Você está no setor Cliente. Um atendente assume esta conversa. Enquanto isso, descreva o que está acontecendo.',
      },
      miss('miss', 'faq', 'painel ou ajuda'),
    ],
    now
  );
}

function sistemaFlow(now: Date): Flow {
  return makeFlow(
    INTAKE_FLOW_SISTEMA,
    'Sistema para empresa',
    'Tamanho do time, pitch e próximo passo (valores, demo ou comercial).',
    [
      {
        id: 'ask_size',
        type: 'question',
        content: 'Perfeito. Quantas pessoas vão atender no painel?',
        options: ['1 atendente', '2 a 5 atendentes', '6 ou mais'],
        nextStepId: 'c_size6',
      },
      cond('c_size6', '6', 'pitch', 'c_size2'),
      cond('c_size2', '2', 'pitch', 'c_size1'),
      cond('c_size1', '1', 'pitch', 'miss_size'),
      {
        id: 'pitch',
        type: 'message',
        content:
          'Cabe no seu caso: o bot filtra, a conversa cai no setor certo e o atendente assume no computador. Fluxos, fila e histórico no mesmo painel — sem depender do WhatsApp Web.',
        nextStepId: 'ask_next',
      },
      {
        id: 'ask_next',
        type: 'question',
        content: 'Qual o próximo passo?',
        options: ['Ver valores e prazo', 'Agendar demo no computador', 'Quero contratar'],
        nextStepId: 'c_valor',
      },
      cond('c_valor', 'valor', 'msg_preco', 'c_computador'),
      cond('c_computador', 'computador', 'to_demo', 'c_contratar'),
      cond('c_contratar', 'contratar', 'to_comercial', 'miss_next'),
      {
        id: 'msg_preco',
        type: 'message',
        content:
          'Implantação para PME, com o painel que você está usando agora. Valores e prazo fechamos na conversa — sem número genérico. Posso te colocar na fila comercial.',
        nextStepId: 'ask_after',
      },
      {
        id: 'ask_after',
        type: 'question',
        content: 'Como prefere seguir?',
        options: ['Agendar conversa', 'Só estou pesquisando'],
        nextStepId: 'c_agendar',
      },
      cond('c_agendar', 'agendar', 'to_comercial_after', 'c_pesquis'),
      cond('c_pesquis', 'pesquis', 'msg_frio', 'miss_after'),
      {
        id: 'msg_frio',
        type: 'message',
        content:
          'Tudo bem. Quando quiser, é só chamar de novo e escolher uma opção. Se preferir, deixe seu nome e cidade nesta conversa.',
      },
      goto('to_demo', INTAKE_FLOW_DEMO),
      goto('to_comercial', INTAKE_FLOW_COMERCIAL),
      goto('to_comercial_after', INTAKE_FLOW_COMERCIAL),
      miss('miss_size', 'ask_size', '1 atendente, 2 a 5 ou 6'),
      miss('miss_next', 'ask_next', 'valores, demo ou contratar'),
      miss('miss_after', 'ask_after', 'agendar ou pesquisar'),
    ],
    now
  );
}

export function salesIntakeFlows(now = new Date()): Flow[] {
  return [inicioFlow(now), sistemaFlow(now), demoFlow(now), clienteFlow(now), comercialFlow(now)];
}

export function atendimentoInicialFlow(now = new Date()): Flow {
  return inicioFlow(now);
}
