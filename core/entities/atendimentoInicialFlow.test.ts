import { planFlowTurn } from '../engine/planFlowTurn';
import {
  INTAKE_DEPARTMENT_CLIENTE,
  INTAKE_DEPARTMENT_COMERCIAL,
  INTAKE_DEPARTMENT_DEMO,
  atendimentoInicialFlow,
} from './atendimentoInicialFlow';

const now = new Date('2026-08-19T12:00:00');
const flow = atendimentoInicialFlow(now);
const contactId = '5511999887766';

function turn(text: string, currentStepId: string | null) {
  return planFlowTurn({
    flow,
    session: currentStepId
      ? {
          contactId,
          flowId: 'inicio',
          currentStepId,
          paused: false,
          updatedAt: now,
        }
      : null,
    contactId,
    incomingText: text,
    now,
  });
}

describe('atendimentoInicialFlow', () => {
  it('primeira mensagem envia boas-vindas e o menu', () => {
    const plan = turn('oi', null);
    expect(plan.replies[0].content).toContain('Michael');
    expect(plan.replies[1].content).toContain('Quero o sistema para minha empresa');
    expect(plan.nextSession.currentStepId).toBe('menu');
  });

  it('sistema + tamanho + contratar cai no comercial', () => {
    expect(turn('Quero o sistema para minha empresa', 'menu').nextSession.currentStepId).toBe(
      'ask_size'
    );
    const afterSize = turn('1 atendente', 'ask_size');
    expect(afterSize.replies.some((reply) => reply.content.includes('Cabe no seu caso'))).toBe(
      true
    );
    expect(afterSize.nextSession.currentStepId).toBe('ask_next');
    const hire = turn('Quero contratar', 'ask_next');
    expect(hire.effects).toEqual([
      { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_COMERCIAL },
    ]);
    expect(hire.replies[0].content).toContain('comercial');
    expect(hire.nextSession.currentStepId).toBeNull();
  });

  it('demonstração e falar com pessoa definem setor', () => {
    const demo = turn('Quero uma demonstração', 'menu');
    expect(demo.effects).toEqual([
      { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_DEMO },
    ]);
    const human = turn('Falar com uma pessoa', 'menu');
    expect(human.effects).toEqual([
      { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_COMERCIAL },
    ]);
  });

  it('cliente que pede ajuda vai ao setor Cliente', () => {
    expect(turn('Já sou cliente', 'menu').nextSession.currentStepId).toBe('faq');
    const help = turn('Preciso de ajuda agora', 'faq');
    expect(help.effects).toEqual([
      { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_CLIENTE },
    ]);
  });

  it('opção inválida no menu envia miss e o menu, sem Olá', () => {
    const plan = turn('asdfgh', 'menu');
    expect(plan.replies.map((reply) => reply.stepId)).toEqual(['miss', 'menu']);
    expect(plan.replies[0].content).toContain('Não identifiquei');
    expect(plan.replies[1].content).toContain('Como posso ajudar');
    expect(plan.replies.some((reply) => reply.content.includes('Olá'))).toBe(false);
    expect(plan.nextSession.currentStepId).toBe('menu');
  });

  it('sessão encerrada não reenvia Olá, só o menu', () => {
    const plan = planFlowTurn({
      flow,
      session: {
        contactId,
        flowId: 'inicio',
        currentStepId: null,
        paused: false,
        updatedAt: now,
      },
      contactId,
      incomingText: 'oi de novo',
      now,
    });
    expect(plan.replies).toHaveLength(1);
    expect(plan.replies[0].stepId).toBe('menu');
    expect(plan.replies[0].content).not.toContain('Olá');
  });
});
