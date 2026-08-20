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

function handoff(id: string, departmentId: string, content: string): FlowStep {
  return {
    id,
    type: 'action',
    content,
    action: { type: 'handoff', departmentId },
  };
}

function miss(id: string, nextStepId: string, hint: string): FlowStep {
  return {
    id,
    type: 'message',
    content: `Não peguei essa opção. Responda com o número (1, 2 ou 3) ou com o texto da linha, tipo: ${hint}.`,
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
    'Menu de entrada. Os ramos saltam para sistema, demo, cliente e comercial.',
    [
      {
        id: 'welcome',
        type: 'message',
        content:
          'Oi, aqui é o Michael. Este WhatsApp é o produto: o bot recebe, organiza e o time responde no computador.',
        delayMs: 600,
        nextStepId: 'menu',
      },
      {
        id: 'menu',
        type: 'question',
        content: 'Como posso te ajudar?',
        delayMs: 400,
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
    'Pausa o bot e chama o setor Comercial.',
    [
      handoff(
        'msg_humano',
        INTAKE_DEPARTMENT_COMERCIAL,
        'Pronto, chamei o comercial. Alguém assume esta conversa daqui a pouco. Pode ir escrevendo o que você precisa.'
      ),
    ],
    now
  );
}

function demoFlow(now: Date): Flow {
  return makeFlow(
    INTAKE_FLOW_DEMO,
    'Demonstração',
    'Pausa o bot e chama o setor Demonstração.',
    [
      handoff(
        'msg_demo',
        INTAKE_DEPARTMENT_DEMO,
        'Vamos marcar uma demonstração ao vivo no computador. Me envia um dia e um horário, tipo quinta 14h. Aí eu te mostro o painel funcionando nesta conversa.'
      ),
    ],
    now
  );
}

function clienteFlow(now: Date): Flow {
  return makeFlow(
    INTAKE_FLOW_CLIENTE,
    'Já sou cliente',
    'Tira dúvida do painel ou chama o setor Cliente.',
    [
      {
        id: 'faq',
        type: 'question',
        content: 'Sobre o que você precisa?',
        options: ['Como o painel funciona', 'Preciso de ajuda agora'],
        nextStepId: 'c_faq_painel',
      },
      cond('c_faq_painel', 'painel', 'msg_faq', 'c_faq_ajuda'),
      cond('c_faq_ajuda', 'ajuda', 'msg_cliente', 'miss'),
      {
        id: 'msg_faq',
        type: 'message',
        content:
          'No computador você vê todas as conversas, assume quando quiser e o bot para de responder sozinho. O roteiro do WhatsApp fica em Fluxos. Se ainda precisar de alguém, é só pedir.',
        nextStepId: 'ask_more',
      },
      {
        id: 'ask_more',
        type: 'question',
        content: 'Quer falar com o time agora?',
        options: ['Era só isso, obrigado', 'Preciso de ajuda agora'],
        nextStepId: 'c_more_ajuda',
      },
      cond('c_more_ajuda', 'ajuda', 'msg_cliente', 'c_more_ok'),
      cond('c_more_ok', 'obrigado', 'msg_ok', 'miss_more'),
      {
        id: 'msg_ok',
        type: 'message',
        content: 'Combinado. Qualquer coisa é só chamar.',
      },
      handoff(
        'msg_cliente',
        INTAKE_DEPARTMENT_CLIENTE,
        'Passei você para o time de clientes. Enquanto alguém assume, descreve o que está acontecendo.'
      ),
      miss('miss', 'faq', 'painel ou ajuda'),
      miss('miss_more', 'ask_more', 'obrigado ou ajuda'),
    ],
    now
  );
}

function sistemaFlow(now: Date): Flow {
  return makeFlow(
    INTAKE_FLOW_SISTEMA,
    'Sistema para empresa',
    'Tamanho do time, como funciona e próximo passo (valores, demo ou comercial).',
    [
      {
        id: 'ask_size',
        type: 'question',
        content: 'Quantas pessoas da sua equipe vão atender pelo painel?',
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
          'Isso encaixa no seu time. O bot faz a triagem, a conversa cai no setor certo e o atendente assume no computador. Fila, histórico e roteiro ficam no mesmo lugar, sem ficar preso no celular.',
        nextStepId: 'ask_next',
      },
      {
        id: 'ask_next',
        type: 'question',
        content: 'O que você prefere agora?',
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
          'Valores e prazo combinamos juntos, conforme o tamanho do time. Posso te passar para o comercial nesta conversa.',
        nextStepId: 'ask_after',
      },
      {
        id: 'ask_after',
        type: 'question',
        content: 'Como você quer seguir?',
        options: ['Agendar conversa', 'Só estou pesquisando'],
        nextStepId: 'c_agendar',
      },
      cond('c_agendar', 'agendar', 'to_comercial_after', 'c_pesquis'),
      cond('c_pesquis', 'pesquis', 'msg_frio', 'miss_after'),
      {
        id: 'msg_frio',
        type: 'message',
        content:
          'Sem problema. Quando quiser avançar, é só chamar de novo. Se preferir, deixa seu nome e cidade aqui que eu guardo.',
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
