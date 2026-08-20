import { FlowStep } from '../entities/Flow';
import { flowHealthIssues } from './flowHealth';

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

  it('aceita path e href de Storage no passo message', () => {
    expect(
      flowHealthIssues([
        { id: 'a', type: 'message', content: '', mediaUrl: 'flows/inicio/welcome' },
      ]).some((issue) => issue.message === 'URL de mídia inválida')
    ).toBe(false);
    expect(
      flowHealthIssues([
        {
          id: 'a',
          type: 'message',
          content: 'oi',
          mediaUrl: '/api/flows/inicio/steps/welcome/media',
        },
      ]).some((issue) => issue.message === 'URL de mídia inválida')
    ).toBe(false);
  });

  it('valor solto continua URL de mídia inválida', () => {
    expect(
      flowHealthIssues([
        { id: 'a', type: 'message', content: 'oi', mediaUrl: 'arquivo.png' },
      ]).some((issue) => issue.message === 'URL de mídia inválida')
    ).toBe(true);
  });
});
