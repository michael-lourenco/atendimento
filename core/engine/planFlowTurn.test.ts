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
      'Qual área?\n- Suporte\n- Vendas',
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

    expect(plan.replies).toEqual([{ content: 'Suporte ok', stepId: 'ok' }]);
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

    expect(plan.replies).toEqual([{ content: 'Outro ok', stepId: 'other' }]);
    expect(plan.nextSession.currentStepId).toBeNull();
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
      'Qual área?\n- Suporte\n- Vendas',
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
    expect(plan.replies).toEqual([{ content: 'Vendas ok', stepId: 'ok' }]);
  });
});
