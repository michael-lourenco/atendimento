import { Flow, FlowStep } from './Flow';

export const INTAKE_DEPARTMENT_COMERCIAL = '1';
export const INTAKE_DEPARTMENT_DEMO = '2';
export const INTAKE_DEPARTMENT_CLIENTE = '3';

function cond(
  id: string,
  value: string,
  trueStepId: string,
  falseStepId: string
): FlowStep {
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

const steps: FlowStep[] = [
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
  cond('c_sistema', 'sistema', 'ask_size', 'c_demo'),
  cond('c_demo', 'demo', 'set_demo', 'c_cliente'),
  cond('c_cliente', 'cliente', 'faq', 'c_pessoa'),
  cond('c_pessoa', 'pessoa', 'set_comercial', 'miss'),
  {
    id: 'ask_size',
    type: 'question',
    content: 'Perfeito. Quantas pessoas vão atender no painel?',
    options: ['1 atendente', '2 a 5 atendentes', '6 ou mais'],
    nextStepId: 'c_size6',
  },
  cond('c_size6', '6', 'pitch', 'c_size2'),
  cond('c_size2', '2', 'pitch', 'c_size1'),
  cond('c_size1', '1', 'pitch', 'miss'),
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
    options: [
      'Ver valores e prazo',
      'Agendar demo no computador',
      'Quero contratar',
    ],
    nextStepId: 'c_valor',
  },
  cond('c_valor', 'valor', 'msg_preco', 'c_computador'),
  cond('c_computador', 'computador', 'set_demo', 'c_contratar'),
  cond('c_contratar', 'contratar', 'set_comercial', 'miss'),
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
  cond('c_agendar', 'agendar', 'set_comercial', 'c_pesquis'),
  cond('c_pesquis', 'pesquis', 'msg_frio', 'miss'),
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
    id: 'set_comercial',
    type: 'action',
    content: '',
    nextStepId: 'msg_humano',
    action: { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_COMERCIAL },
  },
  {
    id: 'set_demo',
    type: 'action',
    content: '',
    nextStepId: 'msg_demo',
    action: { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_DEMO },
  },
  {
    id: 'set_cliente',
    type: 'action',
    content: '',
    nextStepId: 'msg_cliente',
    action: { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_CLIENTE },
  },
  {
    id: 'msg_humano',
    type: 'message',
    content:
      'Encaminhei você ao comercial. Em instantes um especialista assume esta conversa no painel — o bot para aqui para não misturar com o atendimento humano.',
  },
  {
    id: 'msg_demo',
    type: 'message',
    content:
      'A conversa foi para o setor Demonstração. Envie um dia e um horário (ex.: quinta 14h). Abrimos o painel com você: Assumir, setores e o fluxo ao vivo.',
  },
  {
    id: 'msg_cliente',
    type: 'message',
    content:
      'Você está no setor Cliente. Um atendente assume esta conversa. Enquanto isso, descreva o que está acontecendo.',
  },
  {
    id: 'msg_faq',
    type: 'message',
    content:
      'No painel: Conversas (Assumir, Transferir, Finalizar), Fluxos para o roteiro do WhatsApp, e WhatsApp só para o QR. Quando o atendente responde, o bot pausa. Se precisar de alguém, envie: Preciso de ajuda agora.',
  },
  {
    id: 'msg_frio',
    type: 'message',
    content:
      'Tudo bem. Quando quiser, é só chamar de novo e escolher uma opção. Se preferir, deixe seu nome e cidade nesta conversa.',
  },
  {
    id: 'miss',
    type: 'message',
    content:
      'Não identifiquei essa opção. Envie o número da linha (1, 2, 3…) ou o texto (ou parte dele), por exemplo: sistema, demonstração, cliente ou pessoa.',
    nextStepId: 'menu',
  },
];

export function atendimentoInicialFlow(now = new Date()): Flow {
  return {
    id: 'inicio',
    name: 'Atendimento Inicial',
    description:
      'Triagem comercial: sistema, demo, cliente e humano. Setor antes de encerrar o ramo.',
    isActive: true,
    steps,
    createdAt: now,
    updatedAt: now,
  };
}
