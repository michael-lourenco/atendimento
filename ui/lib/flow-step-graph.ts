import { FlowStep } from '@/core/entities/Flow';

export type AddFlowStepOptions = {
  linkPrevious?: boolean;
  canvasPosition?: { x: number; y: number };
};

export function addFlowStep(
  steps: FlowStep[],
  id = `step-${Date.now()}`,
  type: FlowStep['type'] = 'message',
  options: AddFlowStepOptions = {}
): FlowStep[] {
  const created = withStepType(
    {
      id,
      type: 'message',
      content: '',
      ...(options.canvasPosition ? { canvasPosition: options.canvasPosition } : {}),
    },
    type
  );
  if (steps.length === 0) {
    return [created];
  }
  if (options.linkPrevious === false) {
    return [...steps, created];
  }
  const last = steps[steps.length - 1];
  const linked =
    last.type !== 'condition' && !last.nextStepId ? { ...last, nextStepId: id } : last;
  return [...steps.slice(0, -1), linked, created];
}

export type FlowAddKind = 'message' | 'question' | 'action' | 'goToFlow' | 'handoff';

export function addFlowKind(
  steps: FlowStep[],
  kind: FlowAddKind,
  extras: AddFlowStepOptions = {}
): FlowStep[] {
  const type = kind === 'goToFlow' || kind === 'handoff' ? 'action' : kind;
  const id = `step-${Date.now()}-${steps.length}`;
  let next = addFlowStep(steps, id, type, extras);
  if (kind === 'goToFlow') {
    const last = next[next.length - 1];
    next = [...next.slice(0, -1), { ...last, action: { type: 'goToFlow', flowId: '' } }];
  }
  if (kind === 'handoff') {
    const last = next[next.length - 1];
    next = [...next.slice(0, -1), { ...last, action: { type: 'handoff', departmentId: '' } }];
  }
  return next;
}

export function duplicateVisibleFlowStep(steps: FlowStep[], stepId: string): FlowStep[] {
  const index = steps.findIndex((step) => step.id === stepId);
  const step = steps[index];
  if (!step) {
    return steps;
  }
  const copy: FlowStep = {
    ...step,
    id: `step-${Date.now()}-copy`,
    nextStepId: undefined,
    canvasPosition: step.canvasPosition
      ? { x: step.canvasPosition.x + 48, y: step.canvasPosition.y + 48 }
      : undefined,
  };
  return [...steps, copy];
}

export function moveStepToStart(steps: FlowStep[], stepId: string): FlowStep[] {
  const index = steps.findIndex((step) => step.id === stepId);
  if (index <= 0) {
    return steps;
  }
  const next = [...steps];
  const [item] = next.splice(index, 1);
  return [item, ...next];
}

function clearStepRef(step: FlowStep, removedId: string): FlowStep {
  const next: FlowStep = { ...step };
  if (next.nextStepId === removedId) {
    next.nextStepId = undefined;
  }
  if (next.condition) {
    next.condition = {
      ...next.condition,
      trueStepId: next.condition.trueStepId === removedId ? '' : next.condition.trueStepId,
      falseStepId: next.condition.falseStepId === removedId ? '' : next.condition.falseStepId,
    };
  }
  return next;
}

export function removeFlowStep(steps: FlowStep[], index: number): FlowStep[] {
  const removedId = steps[index]?.id;
  if (!removedId) {
    return steps;
  }
  return steps.filter((_, i) => i !== index).map((step) => clearStepRef(step, removedId));
}

export function moveFlowStep(steps: FlowStep[], index: number, direction: -1 | 1): FlowStep[] {
  const target = index + direction;
  if (target < 0 || target >= steps.length) {
    return steps;
  }
  const next = [...steps];
  const current = next[index];
  next[index] = next[target];
  next[target] = current;
  return next;
}

export function withStepType(step: FlowStep, type: FlowStep['type']): FlowStep {
  if (type === 'action') {
    return {
      ...step,
      type,
      condition: undefined,
      options: undefined,
      action: step.action?.type === 'goToFlow'
        ? step.action
        : {
            type: 'setDepartment',
            departmentId: step.action?.type === 'setDepartment' ? step.action.departmentId : '',
          },
    };
  }
  if (type === 'condition') {
    return {
      ...step,
      type,
      action: undefined,
      options: undefined,
      nextStepId: undefined,
      condition: step.condition ?? {
        field: 'content',
        operator: 'contains',
        value: '',
        trueStepId: '',
        falseStepId: '',
      },
    };
  }
  return {
    ...step,
    type,
    action: undefined,
    condition: undefined,
    options: type === 'question' ? step.options : undefined,
  };
}

function pointsTo(step: FlowStep, targetId: string): boolean {
  return (
    step.nextStepId === targetId ||
    step.condition?.trueStepId === targetId ||
    step.condition?.falseStepId === targetId
  );
}

function questionOptions(step: FlowStep): string[] {
  if (step.type !== 'question') {
    return [];
  }
  return (step.options ?? []).map((item) => item.trim()).filter(Boolean);
}

export { listQuestionOptions } from '@/core/engine/questionOptions';

export function questionOptionsForCondition(steps: FlowStep[], conditionId: string): string[] {
  const visited = new Set<string>();

  const fromGraph = (stepId: string): string[] => {
    if (visited.has(stepId)) {
      return [];
    }
    visited.add(stepId);
    const incoming = steps.filter((step) => pointsTo(step, stepId));
    for (const source of incoming) {
      const options = questionOptions(source);
      if (options.length > 0) {
        return options;
      }
    }
    for (const source of incoming) {
      if (source.type === 'condition') {
        const nested = fromGraph(source.id);
        if (nested.length > 0) {
          return nested;
        }
      }
    }
    return [];
  };

  const linked = fromGraph(conditionId);
  if (linked.length > 0) {
    return linked;
  }

  const index = steps.findIndex((step) => step.id === conditionId);
  for (let i = index - 1; i >= 0; i -= 1) {
    const options = questionOptions(steps[i]);
    if (options.length > 0) {
      return options;
    }
  }
  return [];
}

export function optionMatchesConditionValue(option: string, value: string): boolean {
  return option.trim().toLowerCase() === value.trim().toLowerCase();
}
