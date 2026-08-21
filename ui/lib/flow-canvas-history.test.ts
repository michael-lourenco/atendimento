import { FlowStep } from '@/core/entities/Flow';
import { FLOW_CANVAS_UNDO_LIMIT, popCanvasHistory, pushCanvasHistory } from './flow-canvas-history';

const step = (id: string): FlowStep => ({ id, type: 'message', content: id });

describe('flow canvas history', () => {
  it('desfaz o último estado', () => {
    const first = [step('a')];
    const stacked = pushCanvasHistory([], first);
    const popped = popCanvasHistory(stacked);
    expect(popped.snapshot).toEqual(first);
    expect(popped.stack).toEqual([]);
  });

  it('guarda no máximo 10', () => {
    let stack: FlowStep[][] = [];
    for (let index = 0; index < FLOW_CANVAS_UNDO_LIMIT + 5; index += 1) {
      stack = pushCanvasHistory(stack, [step(String(index))]);
    }
    expect(stack).toHaveLength(FLOW_CANVAS_UNDO_LIMIT);
    expect(stack[0][0].id).toBe('5');
  });
});
