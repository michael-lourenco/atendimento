import { FlowStep } from '@/core/entities/Flow';
import { flowCanvasLinks, visibleStepIds } from './flow-canvas-graph';
import { visibleFlowSteps } from './flow-step-outline';

const COL_GAP = 280;
const ROW_GAP = 150;
const ORIGIN = { x: 48, y: 48 };

function neighborIds(steps: FlowStep[], stepId: string, visible: Set<string>): string[] {
  return flowCanvasLinks(steps)
    .filter((link) => link.sourceId === stepId && visible.has(link.targetId))
    .map((link) => link.targetId);
}

export function applyCanvasLayout(steps: FlowStep[], force = false): FlowStep[] {
  const visible = visibleFlowSteps(steps);
  if (visible.length === 0) {
    return steps;
  }
  if (!force && visible.every(({ step }) => step.canvasPosition)) {
    return steps;
  }

  const vis = visibleStepIds(steps);
  const rank = new Map<string, number>();
  const startId = steps[0]?.id;
  const queue: string[] = [];
  if (startId && vis.has(startId)) {
    rank.set(startId, 0);
    queue.push(startId);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const currentRank = rank.get(id) ?? 0;
    for (const nextId of neighborIds(steps, id, vis)) {
      if (!rank.has(nextId)) {
        rank.set(nextId, currentRank + 1);
        queue.push(nextId);
      }
    }
  }

  let extra = Math.max(0, ...rank.values()) + 1;
  for (const { step } of visible) {
    if (!rank.has(step.id)) {
      rank.set(step.id, extra);
      extra += 1;
    }
  }

  const columns = new Map<number, string[]>();
  for (const { step } of visible) {
    const column = rank.get(step.id) ?? 0;
    const ids = columns.get(column) ?? [];
    ids.push(step.id);
    columns.set(column, ids);
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const [column, ids] of columns) {
    ids.forEach((id, row) => {
      positions.set(id, {
        x: ORIGIN.x + column * COL_GAP,
        y: ORIGIN.y + row * ROW_GAP,
      });
    });
  }

  return steps.map((step) => {
    const position = positions.get(step.id);
    if (!position) {
      return step;
    }
    if (!force && step.canvasPosition) {
      return step;
    }
    return { ...step, canvasPosition: position };
  });
}

export function fallbackCanvasPosition(index: number): { x: number; y: number } {
  return {
    x: ORIGIN.x + (index % 3) * 40,
    y: ORIGIN.y + index * 36,
  };
}
