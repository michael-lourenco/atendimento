import { FlowStep } from '@/core/entities/Flow';
import { END_STEP_LABEL } from './flow-step-copy';
import { flowPathLinks } from './flow-path-map';

const message = (id: string, nextStepId?: string): FlowStep => ({
  id,
  type: 'message',
  content: `texto ${id}`,
  nextStepId,
});

describe('flowPathLinks', () => {
  it('lists Depois and condition branches without exposing ids', () => {
    const steps: FlowStep[] = [
      message('a', 'b'),
      {
        id: 'b',
        type: 'condition',
        content: '',
        condition: {
          field: 'content',
          operator: 'equals',
          value: 'Vendas',
          trueStepId: '',
          falseStepId: 'a',
        },
      },
    ];
    const links = flowPathLinks(steps);
    expect(links[0]).toMatchObject({ label: 'Depois', toLabel: '2. Condição — é igual a “Vendas”' });
    expect(links[1].label).toBe('Se sim');
    expect(links[1].toLabel).toBe(END_STEP_LABEL);
    expect(links[2]).toMatchObject({ label: 'Se não', toLabel: '1. Mensagem — texto a' });
    expect(links.map((link) => link.fromLabel).join(' ')).not.toContain('id b');
  });
});
