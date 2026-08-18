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

  it('ramo condition false', () => {
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
});
