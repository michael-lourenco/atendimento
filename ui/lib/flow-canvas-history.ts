import { FlowStep } from '@/core/entities/Flow';

export const FLOW_CANVAS_UNDO_LIMIT = 10;

export function pushCanvasHistory(stack: FlowStep[][], snapshot: FlowStep[]): FlowStep[][] {
  return [...stack, snapshot].slice(-FLOW_CANVAS_UNDO_LIMIT);
}

export function popCanvasHistory(stack: FlowStep[][]): {
  stack: FlowStep[][];
  snapshot: FlowStep[] | null;
} {
  if (stack.length === 0) {
    return { stack, snapshot: null };
  }
  const snapshot = stack[stack.length - 1];
  return { stack: stack.slice(0, -1), snapshot };
}
