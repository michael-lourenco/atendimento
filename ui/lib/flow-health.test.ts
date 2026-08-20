import { FlowStep } from '@/core/entities/Flow';
import { flowHealthIssues } from './flow-health';

const message = (id: string, content = 'oi'): FlowStep => ({
  id,
  type: 'message',
  content,
});

describe('flowHealthIssues', () => {
  it('marca pergunta sem opções', () => {
    const issues = flowHealthIssues([
      { id: 'q', type: 'question', content: 'Oi?', options: [] },
    ]);
    expect(issues.some((issue) => issue.message === 'Pergunta sem opções')).toBe(true);
  });

  it('marca goToFlow vazio', () => {
    const issues = flowHealthIssues([
      { id: 'j', type: 'action', content: '', action: { type: 'goToFlow', flowId: '' } },
    ]);
    expect(issues.some((issue) => issue.message === 'Ir para fluxo sem destino')).toBe(true);
  });

  it('marca bloco solto', () => {
    const steps: FlowStep[] = [message('a', 'olá'), message('b', 'solto')];
    const issues = flowHealthIssues(steps);
    expect(issues.some((issue) => issue.stepId === 'b' && issue.message.includes('solto'))).toBe(
      true
    );
  });
});
