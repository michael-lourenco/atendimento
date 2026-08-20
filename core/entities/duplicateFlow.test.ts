import { duplicateFlow } from './duplicateFlow';
import { Flow } from './Flow';

describe('duplicateFlow', () => {
  it('cria id novo, nome com cópia e inativo', () => {
    const now = new Date('2026-08-19T12:00:00Z');
    const flow: Flow = {
      id: 'inicio',
      name: 'Atendimento',
      isActive: true,
      steps: [{ id: 'a', type: 'message', content: 'Oi' }],
      createdAt: now,
      updatedAt: now,
    };
    const copy = duplicateFlow(flow, now);
    expect(copy.id).toBe(`flow-${now.getTime()}`);
    expect(copy.name).toBe('Atendimento (cópia)');
    expect(copy.isActive).toBe(false);
    expect(copy.steps).toEqual(flow.steps);
  });
});
