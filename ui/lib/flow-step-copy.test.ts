import { FlowStep } from '@/core/entities/Flow';
import { END_STEP_LABEL, STEP_TYPE_LABELS, stepDisplayName } from './flow-step-copy';

describe('stepDisplayName', () => {
  it('uses the Portuguese type and the WhatsApp text', () => {
    const step: FlowStep = { id: 's1', type: 'message', content: 'Olá! Bem-vindo.' };
    expect(stepDisplayName(step, 0)).toBe('1. Mensagem — Olá! Bem-vindo.');
  });

  it('uses the department name for set-department actions', () => {
    const step: FlowStep = {
      id: 's2',
      type: 'action',
      content: '',
      action: { type: 'setDepartment', departmentId: '1' },
    };
    expect(stepDisplayName(step, 2, [{ id: '1', name: 'Vendas' }])).toBe(
      '3. Definir setor — Vendas'
    );
  });

  it('does not expose the step id', () => {
    const step: FlowStep = {
      id: 'cond_vendas',
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
    expect(stepDisplayName(step, 1)).toBe('2. Condição — contém “vendas”');
    expect(stepDisplayName(step, 1)).not.toContain('cond_vendas');
  });
});

describe('copy', () => {
  it('keeps operator and end labels in Portuguese', () => {
    expect(STEP_TYPE_LABELS.question).toBe('Pergunta');
    expect(END_STEP_LABEL).toBe('Encerrar atendimento');
  });
});
