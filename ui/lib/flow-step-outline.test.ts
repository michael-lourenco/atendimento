import { atendimentoInicialFlow, salesIntakeFlows } from '@/core/entities/atendimentoInicialFlow';
import { optionBranchLabel, visibleFlowSteps, moveVisibleFlowStep } from './flow-step-outline';

const now = new Date('2026-08-19T12:00:00Z');

describe('visibleFlowSteps', () => {
  it('hides conditions that belong to a question in the intake flow', () => {
    const steps = atendimentoInicialFlow(now).steps;
    const visible = visibleFlowSteps(steps);
    expect(visible.some(({ step }) => step.type === 'condition')).toBe(false);
    expect(visible.length).toBeLessThan(steps.length);
    expect(visible.map(({ step }) => step.id)).toContain('menu');
    expect(visible.map(({ step }) => step.id)).toContain('welcome');
  });
});

describe('optionBranchLabel', () => {
  it('describes where the first menu option goes', () => {
    const steps = atendimentoInicialFlow(now).steps;
    const menu = steps.find((step) => step.id === 'menu')!;
    const label = optionBranchLabel(
      steps,
      menu,
      'Quero o sistema para minha empresa',
      [],
      salesIntakeFlows(now)
    );
    expect(label).toContain('Vai para:');
    expect(label).toContain('Sistema para empresa');
  });
});

describe('moveVisibleFlowStep', () => {
  it('swaps two visible steps without using a hidden condition as neighbor', () => {
    const steps = atendimentoInicialFlow(now).steps;
    const moved = moveVisibleFlowStep(steps, 'menu', -1);
    expect(moved[0].id).toBe('menu');
    expect(moved[1].id).toBe('welcome');
  });
});
