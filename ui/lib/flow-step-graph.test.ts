import { FlowStep } from '@/core/entities/Flow';
import { addFlowStep, moveFlowStep, optionMatchesConditionValue, questionOptionsForCondition, removeFlowStep, withStepType } from './flow-step-graph';

const message = (id: string, nextStepId?: string): FlowStep => ({
  id,
  type: 'message',
  content: `texto ${id}`,
  nextStepId,
});

describe('addFlowStep', () => {
  it('starts with a message step', () => {
    const next = addFlowStep([], 'a');
    expect(next).toEqual([{ id: 'a', type: 'message', content: '' }]);
  });

  it('links the previous step when it has no destination', () => {
    const next = addFlowStep([message('a')], 'b');
    expect(next[0].nextStepId).toBe('b');
    expect(next[1].id).toBe('b');
  });

  it('does not overwrite an existing destination', () => {
    const next = addFlowStep([message('a', 'other')], 'b');
    expect(next[0].nextStepId).toBe('other');
  });

  it('does not set nextStepId on a condition', () => {
    const condition: FlowStep = {
      id: 'c',
      type: 'condition',
      content: '',
      condition: {
        field: 'content',
        operator: 'contains',
        value: 'vendas',
        trueStepId: 'x',
        falseStepId: 'y',
      },
    };
    const next = addFlowStep([condition], 'b');
    expect(next[0].nextStepId).toBeUndefined();
  });
});

describe('removeFlowStep', () => {
  it('clears nextStepId and condition branches that pointed to the removed step', () => {
    const steps: FlowStep[] = [
      message('a', 'b'),
      {
        id: 'b',
        type: 'condition',
        content: '',
        condition: {
          field: 'content',
          operator: 'contains',
          value: 'ok',
          trueStepId: 'c',
          falseStepId: 'a',
        },
      },
      message('c'),
    ];
    const next = removeFlowStep(steps, 2);
    expect(next.map((step) => step.id)).toEqual(['a', 'b']);
    expect(next[1].condition?.trueStepId).toBe('');
    expect(next[1].condition?.falseStepId).toBe('a');
  });
});

describe('moveFlowStep', () => {
  it('swaps neighbors and ignores out of range', () => {
    const steps = [message('a'), message('b'), message('c')];
    expect(moveFlowStep(steps, 0, 1).map((step) => step.id)).toEqual(['b', 'a', 'c']);
    expect(moveFlowStep(steps, 0, -1)).toBe(steps);
  });
});

describe('questionOptionsForCondition', () => {
  const question = (id: string, options: string[], nextStepId?: string): FlowStep => ({
    id,
    type: 'question',
    content: 'Como podemos ajudar?',
    options,
    nextStepId,
  });

  const condition = (id: string, falseStepId = ''): FlowStep => ({
    id,
    type: 'condition',
    content: '',
    condition: {
      field: 'content',
      operator: 'contains',
      value: '',
      trueStepId: '',
      falseStepId,
    },
  });

  it('uses options from the question that points to the condition', () => {
    const steps = [question('q', ['Vendas', 'Suporte'], 'c'), condition('c')];
    expect(questionOptionsForCondition(steps, 'c')).toEqual(['Vendas', 'Suporte']);
  });

  it('inherits options through a chain of false branches', () => {
    const steps = [
      question('q', ['Vendas', 'Suporte', 'Financeiro'], 'c1'),
      condition('c1', 'c2'),
      condition('c2'),
    ];
    expect(questionOptionsForCondition(steps, 'c2')).toEqual(['Vendas', 'Suporte', 'Financeiro']);
  });

  it('falls back to the previous question in the list when the graph is not linked', () => {
    const steps = [question('q', ['Outros']), condition('c')];
    expect(questionOptionsForCondition(steps, 'c')).toEqual(['Outros']);
  });

  it('returns empty when there is no question with options', () => {
    expect(questionOptionsForCondition([condition('c')], 'c')).toEqual([]);
  });
});

describe('optionMatchesConditionValue', () => {
  it('matches option text ignoring case and trim', () => {
    expect(optionMatchesConditionValue('Vendas', ' vendas ')).toBe(true);
    expect(optionMatchesConditionValue('Suporte técnico', 'suporte')).toBe(false);
  });
});

describe('withStepType', () => {
  it('clears nextStepId when switching to a condition', () => {
    const next = withStepType(message('a', 'b'), 'condition');
    expect(next.type).toBe('condition');
    expect(next.nextStepId).toBeUndefined();
    expect(next.condition?.operator).toBe('contains');
  });
});
