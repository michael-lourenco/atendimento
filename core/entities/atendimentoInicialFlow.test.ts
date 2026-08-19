import { planFlowTurn } from '../engine/planFlowTurn';
import {
  INTAKE_DEPARTMENT_CLIENTE,
  INTAKE_DEPARTMENT_COMERCIAL,
  INTAKE_DEPARTMENT_DEMO,
  INTAKE_FLOW_CLIENTE,
  INTAKE_FLOW_COMERCIAL,
  INTAKE_FLOW_DEMO,
  INTAKE_FLOW_INICIO,
  INTAKE_FLOW_SISTEMA,
  salesIntakeFlows,
} from './atendimentoInicialFlow';

const now = new Date('2026-08-19T12:00:00');
const catalog = salesIntakeFlows(now);
const contactId = '5511999887766';

function flowById(id: string) {
  return catalog.find((item) => item.id === id)!;
}

function turn(text: string, session: { flowId: string; currentStepId: string | null } | null) {
  const flow = session ? flowById(session.flowId) : flowById(INTAKE_FLOW_INICIO);
  return planFlowTurn({
    flow,
    flows: catalog,
    session: session
      ? {
          contactId,
          flowId: session.flowId,
          currentStepId: session.currentStepId,
          paused: false,
          updatedAt: now,
        }
      : null,
    contactId,
    incomingText: text,
    now,
  });
}

describe('salesIntakeFlows', () => {
  it('primeira mensagem envia boas-vindas e o menu no fluxo inicio', () => {
    const plan = turn('oi', null);
    expect(plan.replies[0].content).toContain('Michael');
    expect(plan.replies[1].content).toContain('Quero o sistema para minha empresa');
    expect(plan.nextSession.flowId).toBe(INTAKE_FLOW_INICIO);
    expect(plan.nextSession.currentStepId).toBe('menu');
  });

  it('sistema + tamanho + contratar salta ao comercial', () => {
    const toSistema = turn('Quero o sistema para minha empresa', {
      flowId: INTAKE_FLOW_INICIO,
      currentStepId: 'menu',
    });
    expect(toSistema.nextSession.flowId).toBe(INTAKE_FLOW_SISTEMA);
    expect(toSistema.nextSession.currentStepId).toBe('ask_size');
    const afterSize = turn('1 atendente', {
      flowId: INTAKE_FLOW_SISTEMA,
      currentStepId: 'ask_size',
    });
    expect(afterSize.replies.some((reply) => reply.content.includes('Cabe no seu caso'))).toBe(
      true
    );
    expect(afterSize.nextSession.currentStepId).toBe('ask_next');
    const hire = turn('Quero contratar', {
      flowId: INTAKE_FLOW_SISTEMA,
      currentStepId: 'ask_next',
    });
    expect(hire.effects).toEqual([
      { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_COMERCIAL },
    ]);
    expect(hire.replies[0].content).toContain('comercial');
    expect(hire.nextSession.flowId).toBe(INTAKE_FLOW_COMERCIAL);
    expect(hire.nextSession.currentStepId).toBeNull();
  });

  it('demonstração e falar com pessoa definem setor via fluxos ligados', () => {
    const demo = turn('Quero uma demonstração', {
      flowId: INTAKE_FLOW_INICIO,
      currentStepId: 'menu',
    });
    expect(demo.effects).toEqual([
      { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_DEMO },
    ]);
    expect(demo.nextSession.flowId).toBe(INTAKE_FLOW_DEMO);
    const human = turn('Falar com uma pessoa', {
      flowId: INTAKE_FLOW_INICIO,
      currentStepId: 'menu',
    });
    expect(human.effects).toEqual([
      { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_COMERCIAL },
    ]);
    expect(human.nextSession.flowId).toBe(INTAKE_FLOW_COMERCIAL);
  });

  it('cliente que pede ajuda vai ao setor Cliente', () => {
    const toFaq = turn('Já sou cliente', {
      flowId: INTAKE_FLOW_INICIO,
      currentStepId: 'menu',
    });
    expect(toFaq.nextSession.flowId).toBe(INTAKE_FLOW_CLIENTE);
    expect(toFaq.nextSession.currentStepId).toBe('faq');
    const help = turn('Preciso de ajuda agora', {
      flowId: INTAKE_FLOW_CLIENTE,
      currentStepId: 'faq',
    });
    expect(help.effects).toEqual([
      { type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_CLIENTE },
    ]);
  });

  it('número da opção no menu segue o mesmo ramo que o texto', () => {
    expect(
      turn('1', { flowId: INTAKE_FLOW_INICIO, currentStepId: 'menu' }).nextSession.flowId
    ).toBe(INTAKE_FLOW_SISTEMA);
    expect(
      turn('2', { flowId: INTAKE_FLOW_INICIO, currentStepId: 'menu' }).effects
    ).toEqual([{ type: 'setDepartment', departmentId: INTAKE_DEPARTMENT_DEMO }]);
    const size = turn('3', { flowId: INTAKE_FLOW_SISTEMA, currentStepId: 'ask_size' });
    expect(size.replies.some((reply) => reply.content.includes('Cabe no seu caso'))).toBe(true);
    expect(size.nextSession.currentStepId).toBe('ask_next');
  });

  it('opção inválida no menu envia miss e o menu, sem Olá', () => {
    const plan = turn('asdfgh', { flowId: INTAKE_FLOW_INICIO, currentStepId: 'menu' });
    expect(plan.replies.map((reply) => reply.stepId)).toEqual(['miss', 'menu']);
    expect(plan.replies[0].content).toContain('Não identifiquei');
    expect(plan.replies[1].content).toContain('Como posso ajudar');
    expect(plan.replies.some((reply) => reply.content.includes('Olá'))).toBe(false);
    expect(plan.nextSession.flowId).toBe(INTAKE_FLOW_INICIO);
    expect(plan.nextSession.currentStepId).toBe('menu');
  });

  it('sessão encerrada no inicio não reenvia Olá, só o menu', () => {
    const plan = turn('oi de novo', { flowId: INTAKE_FLOW_INICIO, currentStepId: null });
    expect(plan.replies).toHaveLength(1);
    expect(plan.replies[0].stepId).toBe('menu');
    expect(plan.replies[0].content).not.toContain('Olá');
  });
});
