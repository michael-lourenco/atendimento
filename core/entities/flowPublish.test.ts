import { flowHasUnpublishedChanges, flowStepsForEngine } from './flowPublish';
import { Flow } from './Flow';

const now = new Date('2026-08-21T12:00:00Z');

const flow: Flow = {
  id: 'inicio',
  name: 'Atendimento',
  isActive: true,
  steps: [{ id: 'draft', type: 'message', content: 'rascunho' }],
  createdAt: now,
  updatedAt: now,
};

describe('flowPublish', () => {
  it('sem publicado usa os passos do editor', () => {
    expect(flowStepsForEngine(flow)).toEqual(flow.steps);
    expect(flowHasUnpublishedChanges(flow)).toBe(true);
  });

  it('com publicado o motor usa a cópia', () => {
    const published = [{ id: 'live', type: 'message' as const, content: 'no ar' }];
    const next = { ...flow, publishedSteps: published };
    expect(flowStepsForEngine(next)).toEqual(published);
    expect(flowHasUnpublishedChanges(next)).toBe(true);
    expect(flowHasUnpublishedChanges({ ...next, steps: published })).toBe(false);
  });
});
