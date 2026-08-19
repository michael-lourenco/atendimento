import { FlowStep } from '@/core/entities/Flow';
import { createOptionPaths, defaultOptionDestinations, hasCompleteOptionPaths } from './flow-option-paths';

const question = (id: string, options: string[], nextStepId?: string): FlowStep => ({
  id,
  type: 'question',
  content: 'Como podemos ajudar?',
  options,
  nextStepId,
});

const condition = (
  id: string,
  value: string,
  falseStepId = '',
  trueStepId = ''
): FlowStep => ({
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
});

const message = (id: string): FlowStep => ({
  id,
  type: 'message',
  content: `texto ${id}`,
});

describe('createOptionPaths', () => {
  it('does nothing without options', () => {
    const steps = [question('q', [])];
    expect(createOptionPaths(steps, 0, (index) => `n${index}`)).toBe(steps);
  });

  it('creates an equals condition per option and chains the false branch', () => {
    const steps = [question('q', ['Vendas', 'Suporte'])];
    const next = createOptionPaths(steps, 0, (index) => `c${index}`);
    expect(next[0].nextStepId).toBe('c0');
    expect(next.map((step) => step.id)).toEqual(['q', 'c0', 'c1']);
    expect(next[1].condition).toMatchObject({
      operator: 'equals',
      value: 'Vendas',
      trueStepId: '',
      falseStepId: 'c1',
    });
    expect(next[2].condition).toMatchObject({
      operator: 'equals',
      value: 'Suporte',
      falseStepId: '',
    });
  });

  it('keeps an existing destination as the last false branch', () => {
    const steps = [question('q', ['Vendas'], 'msg'), message('msg')];
    const next = createOptionPaths(steps, 0, () => 'c0');
    expect(next[1].condition?.falseStepId).toBe('msg');
  });

  it('reuses a contains condition that matches part of the option text', () => {
    const steps = [
      question('q', ['Suporte técnico', 'Vendas'], 'c1'),
      condition('c1', 'suporte', '', 'setor-suporte'),
    ];
    const next = createOptionPaths(steps, 0, () => 'c2');
    expect(next.find((step) => step.id === 'c1')?.condition?.trueStepId).toBe('setor-suporte');
    expect(next.find((step) => step.id === 'c1')?.condition?.falseStepId).toBe('c2');
    expect(next.find((step) => step.id === 'c2')?.condition?.value).toBe('Vendas');
  });

  it('reuses conditions already in the chain and keeps true destinations', () => {
    const steps = [
      question('q', ['Vendas', 'Suporte'], 'c1'),
      condition('c1', 'vendas', '', 'setor-vendas'),
    ];
    const next = createOptionPaths(steps, 0, () => 'c2');
    expect(next.find((step) => step.id === 'c1')?.condition).toMatchObject({
      operator: 'contains',
      value: 'vendas',
      trueStepId: 'setor-vendas',
      falseStepId: 'c2',
    });
    expect(next.find((step) => step.id === 'c2')?.condition?.value).toBe('Suporte');
  });

  it('is idempotent when every option already has a condition', () => {
    const steps = [
      question('q', ['Vendas', 'Suporte'], 'c0'),
      condition('c0', 'Vendas', 'c1', 'a'),
      condition('c1', 'Suporte', '', 'b'),
    ];
    const next = createOptionPaths(steps, 0, (index) => `extra${index}`);
    expect(next.map((step) => step.id)).toEqual(['q', 'c0', 'c1']);
    expect(hasCompleteOptionPaths(next, 0)).toBe(true);
  });

  it('creates a set-department action when the option destination is a sector', () => {
    const steps = [question('q', ['Vendas'])];
    const next = createOptionPaths(steps, 0, (index) => `n${index}`, {
      Vendas: { type: 'department', departmentId: 'dep-1' },
    });
    const action = next.find((step) => step.type === 'action');
    expect(action?.action).toEqual({ type: 'setDepartment', departmentId: 'dep-1' });
    expect(next.find((step) => step.type === 'condition')?.condition?.trueStepId).toBe(action?.id);
  });
});

describe('hasCompleteOptionPaths', () => {
  it('is false until the question points at a full chain', () => {
    expect(hasCompleteOptionPaths([question('q', ['Vendas'])], 0)).toBe(false);
  });
});

describe('defaultOptionDestinations', () => {
  it('picks a department with the same name as the option', () => {
    const dest = defaultOptionDestinations(['Vendas', 'Outros'], [
      { id: '1', name: 'Vendas' },
    ]);
    expect(dest.Vendas).toEqual({ type: 'department', departmentId: '1' });
    expect(dest.Outros).toEqual({ type: 'end' });
  });
});
