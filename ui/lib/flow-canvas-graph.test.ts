import { FlowStep } from '@/core/entities/Flow';
import { flowCanvasLinks, setCanvasPosition, setStepLink, sourceHandlesFor, visibleStepIds } from './flow-canvas-graph';
import { applyCanvasLayout } from './flow-canvas-layout';
import { trueStepIdForOption } from './flow-option-paths';

const message = (id: string, nextStepId?: string): FlowStep => ({
  id,
  type: 'message',
  content: `texto ${id}`,
  nextStepId,
});

const question = (id: string, options: string[], nextStepId?: string): FlowStep => ({
  id,
  type: 'question',
  content: 'Como podemos ajudar?',
  options,
  nextStepId,
});

describe('flowCanvasLinks', () => {
  it('hides question conditions from visible ids and draws option arrows', () => {
    const steps: FlowStep[] = [
      question('q', ['Vendas', 'Suporte'], 'c0'),
      {
        id: 'c0',
        type: 'condition',
        content: '',
        condition: {
          field: 'content',
          operator: 'equals',
          value: 'Vendas',
          trueStepId: 'm1',
          falseStepId: 'c1',
        },
      },
      {
        id: 'c1',
        type: 'condition',
        content: '',
        condition: {
          field: 'content',
          operator: 'equals',
          value: 'Suporte',
          trueStepId: 'm2',
          falseStepId: '',
        },
      },
      message('m1'),
      message('m2'),
    ];

    expect([...visibleStepIds(steps)].sort()).toEqual(['m1', 'm2', 'q']);
    expect(flowCanvasLinks(steps)).toEqual([
      { sourceId: 'q', sourceHandle: 'option:0', targetId: 'm1', label: 'Vendas' },
      { sourceId: 'q', sourceHandle: 'option:1', targetId: 'm2', label: 'Suporte' },
    ]);
  });

  it('draws Depois for a message nextStepId', () => {
    const steps = [message('a', 'b'), message('b')];
    expect(flowCanvasLinks(steps)).toEqual([
      { sourceId: 'a', sourceHandle: 'next', targetId: 'b', label: 'Depois' },
    ]);
  });
});

describe('setStepLink', () => {
  it('sets and clears nextStepId', () => {
    const linked = setStepLink([message('a'), message('b')], 'a', 'next', 'b');
    expect(linked[0].nextStepId).toBe('b');
    expect(setStepLink(linked, 'a', 'next', '')[0].nextStepId).toBeUndefined();
  });

  it('creates option paths and points the option to a step', () => {
    const steps = [question('q', ['Vendas']), message('m1')];
    const linked = setStepLink(steps, 'q', 'option:0', 'm1');
    expect(trueStepIdForOption(linked, linked[0], 'Vendas')).toBe('m1');
    expect(flowCanvasLinks(linked)).toEqual([
      { sourceId: 'q', sourceHandle: 'option:0', targetId: 'm1', label: 'Vendas' },
    ]);
  });

  it('ignores a loop to itself', () => {
    const steps = [message('a')];
    expect(setStepLink(steps, 'a', 'next', 'a')).toBe(steps);
  });
});

describe('applyCanvasLayout', () => {
  it('fills canvasPosition and keeps one already saved', () => {
    const saved: FlowStep = { ...message('a', 'b'), canvasPosition: { x: 9, y: 9 } };
    const next = applyCanvasLayout([saved, message('b')]);
    expect(next[0].canvasPosition).toEqual({ x: 9, y: 9 });
    expect(next[1].canvasPosition).toEqual({ x: 328, y: 48 });
  });

  it('force rebuilds every visible position', () => {
    const saved: FlowStep = { ...message('a'), canvasPosition: { x: 9, y: 9 } };
    const next = applyCanvasLayout([saved], true);
    expect(next[0].canvasPosition).toEqual({ x: 48, y: 48 });
  });
});

describe('setCanvasPosition', () => {
  it('patches only that step', () => {
    const next = setCanvasPosition([message('a'), message('b')], 'b', { x: 1, y: 2 });
    expect(next[1].canvasPosition).toEqual({ x: 1, y: 2 });
    expect(next[0].canvasPosition).toBeUndefined();
  });
});

describe('sourceHandlesFor', () => {
  it('uses one handle per question option', () => {
    expect(sourceHandlesFor(question('q', ['A', 'B'])).map((item) => item.id)).toEqual([
      'option:0',
      'option:1',
    ]);
  });
});
