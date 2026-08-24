import { Flow } from '../entities/Flow';
import { planFlowTurn } from './planFlowTurn';

const now = new Date('2026-08-18T15:00:00Z');

const flow: Flow = {
  id: 'inicio',
  name: 'Atendimento Inicial',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  steps: [
    { id: 'welcome', type: 'message', content: 'Olá', nextStepId: 'ask' },
    {
      id: 'ask',
      type: 'question',
      content: 'Qual área?',
      options: ['Suporte', 'Vendas'],
      nextStepId: 'branch',
    },
    {
      id: 'branch',
      type: 'condition',
      content: '',
      condition: {
        field: 'content',
        operator: 'contains',
        value: 'suporte',
        trueStepId: 'ok',
        falseStepId: 'other',
      },
    },
    { id: 'ok', type: 'message', content: 'Suporte ok' },
    { id: 'other', type: 'message', content: 'Outro ok' },
  ],
};

describe('planFlowTurn', () => {
  it('primeira mensagem cria sessão e envia até a question', () => {
    const plan = planFlowTurn({
      flow,
      session: null,
      contactId: '5511999999999',
      incomingText: 'oi',
      now,
    });

    expect(plan.replies.map((reply) => reply.content)).toEqual([
      'Olá',
      'Qual área?\n1. Suporte\n2. Vendas',
    ]);
    expect(plan.effects).toEqual([]);
    expect(plan.nextSession).toEqual({
      contactId: '5511999999999',
      flowId: 'inicio',
      currentStepId: 'ask',
      paused: false,
      updatedAt: now,
    });
  });

  it('resposta da question avança nextStepId e ramo condition true', () => {
    const plan = planFlowTurn({
      flow,
      session: {
        contactId: '5511999999999',
        flowId: 'inicio',
        currentStepId: 'ask',
        paused: false,
        updatedAt: now,
      },
      contactId: '5511999999999',
      incomingText: 'Suporte técnico',
      now,
    });

    expect(plan.replies).toEqual([{ content: 'Suporte ok', stepId: 'ok', flowId: 'inicio' }]);
    expect(plan.nextSession.currentStepId).toBeNull();
  });

  it('action setDepartment vira efeito e não envia WhatsApp', () => {
    const plan = planFlowTurn({
      flow,
      session: {
        contactId: '5511999999999',
        flowId: 'inicio',
        currentStepId: 'ask',
        paused: false,
        updatedAt: now,
      },
      contactId: '5511999999999',
      incomingText: 'Vendas',
      now,
    });

    expect(plan.replies).toEqual([{ content: 'Outro ok', stepId: 'other', flowId: 'inicio' }]);
    expect(plan.nextSession.currentStepId).toBeNull();
  });

  it('número da opção na question segue o mesmo ramo que o texto', () => {
    const plan = planFlowTurn({
      flow,
      session: {
        contactId: '5511999999999',
        flowId: 'inicio',
        currentStepId: 'ask',
        paused: false,
        updatedAt: now,
      },
      contactId: '5511999999999',
      incomingText: '1',
      now,
    });

    expect(plan.replies).toEqual([{ content: 'Suporte ok', stepId: 'ok', flowId: 'inicio' }]);
  });

  it('sessão encerrada não reenvia a abertura, só a primeira question', () => {
    const plan = planFlowTurn({
      flow,
      session: {
        contactId: '5511999999999',
        flowId: 'inicio',
        currentStepId: null,
        paused: false,
        updatedAt: now,
      },
      contactId: '5511999999999',
      incomingText: 'oi de novo',
      now,
    });

    expect(plan.replies.map((reply) => reply.content)).toEqual([
      'Qual área?\n1. Suporte\n2. Vendas',
    ]);
    expect(plan.nextSession.currentStepId).toBe('ask');
  });

  it('action setDepartment vira efeito e não envia WhatsApp', () => {
    const withAction: Flow = {
      ...flow,
      steps: [
        {
          id: 'ask',
          type: 'question',
          content: 'Qual área?',
          nextStepId: 'set_vendas',
        },
        {
          id: 'set_vendas',
          type: 'action',
          content: 'não enviar',
          nextStepId: 'ok',
          action: { type: 'setDepartment', departmentId: '1' },
        },
        { id: 'ok', type: 'message', content: 'Vendas ok' },
      ],
    };

    const plan = planFlowTurn({
      flow: withAction,
      session: {
        contactId: '5511999999999',
        flowId: 'inicio',
        currentStepId: 'ask',
        paused: false,
        updatedAt: now,
      },
      contactId: '5511999999999',
      incomingText: 'Vendas',
      now,
    });

    expect(plan.effects).toEqual([{ type: 'setDepartment', departmentId: '1' }]);
    expect(plan.replies).toEqual([{ content: 'Vendas ok', stepId: 'ok', flowId: 'inicio' }]);
  });

  it('goToFlow continua no primeiro passo do destino e troca a sessão', () => {
    const faq: Flow = {
      id: 'faq',
      name: 'FAQ',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      steps: [
        { id: 'faq_hi', type: 'message', content: 'Ajuda rápida', nextStepId: 'faq_ask' },
        { id: 'faq_ask', type: 'question', content: 'Qual dúvida?' },
      ],
    };
    const withJump: Flow = {
      ...flow,
      steps: [
        { id: 'welcome', type: 'message', content: 'Olá', nextStepId: 'jump' },
        {
          id: 'jump',
          type: 'action',
          content: '',
          action: { type: 'goToFlow', flowId: 'faq' },
        },
      ],
    };

    const plan = planFlowTurn({
      flow: withJump,
      flows: [withJump, faq],
      session: null,
      contactId: '5511999999999',
      incomingText: 'oi',
      now,
    });

    expect(plan.replies.map((reply) => reply.content)).toEqual(['Olá', 'Ajuda rápida', 'Qual dúvida?']);
    expect(plan.nextSession.flowId).toBe('faq');
    expect(plan.nextSession.currentStepId).toBe('faq_ask');
  });

  it('goToFlow inativo não salta', () => {
    const faq: Flow = {
      id: 'faq',
      name: 'FAQ',
      isActive: false,
      createdAt: now,
      updatedAt: now,
      steps: [{ id: 'faq_hi', type: 'message', content: 'Ajuda rápida' }],
    };
    const withJump: Flow = {
      ...flow,
      steps: [
        {
          id: 'jump',
          type: 'action',
          content: '',
          nextStepId: 'fallback',
          action: { type: 'goToFlow', flowId: 'faq' },
        },
        { id: 'fallback', type: 'message', content: 'Seguimos aqui' },
      ],
    };

    const plan = planFlowTurn({
      flow: withJump,
      flows: [withJump, faq],
      session: null,
      contactId: '5511999999999',
      incomingText: 'oi',
      now,
    });

    expect(plan.replies).toEqual([
      { content: 'Seguimos aqui', stepId: 'fallback', flowId: 'inicio' },
    ]);
    expect(plan.nextSession.flowId).toBe('inicio');
  });

  it('goToFlow com Ao voltar retoma a origem quando o destino acaba', () => {
    const faq: Flow = {
      id: 'faq',
      name: 'FAQ',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      steps: [{ id: 'faq_hi', type: 'message', content: 'Ajuda rápida' }],
    };
    const withJump: Flow = {
      ...flow,
      steps: [
        {
          id: 'jump',
          type: 'action',
          content: '',
          nextStepId: 'after',
          action: { type: 'goToFlow', flowId: 'faq' },
        },
        { id: 'after', type: 'message', content: 'De volta' },
      ],
    };
    const plan = planFlowTurn({
      flow: withJump,
      flows: [withJump, faq],
      session: null,
      contactId: '5511999999999',
      incomingText: 'oi',
      now,
    });
    expect(plan.replies.map((reply) => reply.content)).toEqual(['Ajuda rápida', 'De volta']);
    expect(plan.nextSession.flowId).toBe('inicio');
    expect(plan.nextSession.returnStack).toBeUndefined();
  });

  it('handoff pausa e pode gravar setor', () => {
    const withHandoff: Flow = {
      ...flow,
      steps: [
        {
          id: 'h',
          type: 'action',
          content: 'Um humano vem',
          action: { type: 'handoff', departmentId: '1' },
        },
      ],
    };
    const plan = planFlowTurn({
      flow: withHandoff,
      session: null,
      contactId: '5511999999999',
      incomingText: 'oi',
      now,
    });
    expect(plan.effects).toEqual([{ type: 'setDepartment', departmentId: '1' }]);
    expect(plan.replies[0].content).toBe('Um humano vem');
    expect(plan.nextSession.paused).toBe(true);
  });

  it('palavra-chave de outro fluxo ativo inicia esse roteiro', () => {
    const price: Flow = {
      id: 'preco',
      name: 'Preço',
      isActive: true,
      keywords: ['preço', 'valor'],
      createdAt: now,
      updatedAt: now,
      steps: [{ id: 'p', type: 'message', content: 'Tabela de valores' }],
    };
    const plan = planFlowTurn({
      flow,
      flows: [flow, price],
      session: {
        contactId: '5511999999999',
        flowId: 'inicio',
        currentStepId: 'ask',
        paused: false,
        updatedAt: now,
      },
      contactId: '5511999999999',
      incomingText: 'quero o preço',
      now,
    });
    expect(plan.replies.map((reply) => reply.content)).toEqual(['Tabela de valores']);
    expect(plan.nextSession.flowId).toBe('preco');
  });

  it('currentStepId inexistente mostra só o menu conhecido', () => {
    const plan = planFlowTurn({
      flow,
      session: {
        contactId: '5511999999999',
        flowId: 'inicio',
        currentStepId: 'sumiu',
        paused: false,
        updatedAt: now,
      },
      contactId: '5511999999999',
      incomingText: 'oi',
      now,
    });
    expect(plan.replies.map((reply) => reply.content)).toEqual([
      'Qual área?\n1. Suporte\n2. Vendas',
    ]);
    expect(plan.nextSession.currentStepId).toBe('ask');
  });

  it('atalho humano vence a pergunta', () => {
    const plan = planFlowTurn({
      flow,
      session: {
        contactId: '5511999999999',
        flowId: 'inicio',
        currentStepId: 'ask',
        paused: false,
        updatedAt: now,
      },
      contactId: '5511999999999',
      incomingText: '0',
      now,
    });
    expect(plan.replies.map((reply) => reply.content)).toEqual([
      'Vou te passar para uma pessoa da equipe.',
    ]);
    expect(plan.nextSession.paused).toBe(true);
  });
});
