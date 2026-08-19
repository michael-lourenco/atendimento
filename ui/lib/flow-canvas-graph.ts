import { FlowStep } from '@/core/entities/Flow';
import { setOptionTrueStepId, trueStepIdForOption } from './flow-option-paths';
import { listQuestionOptions } from './flow-step-graph';
import { visibleFlowSteps } from './flow-step-outline';

export type FlowCanvasLink = {
  sourceId: string;
  sourceHandle: string;
  targetId: string;
  label: string;
};

export type FlowCanvasHandle = {
  id: string;
  label: string;
};

export function visibleStepIds(steps: FlowStep[]): Set<string> {
  return new Set(visibleFlowSteps(steps).map(({ step }) => step.id));
}

export function sourceHandlesFor(step: FlowStep): FlowCanvasHandle[] {
  if (step.type === 'question') {
    const options = listQuestionOptions(step);
    if (options.length > 0) {
      return options.map((option, index) => ({
        id: `option:${index}`,
        label: `${index + 1}. ${option}`,
      }));
    }
  }
  if (step.type === 'condition') {
    return [
      { id: 'true', label: 'Se sim' },
      { id: 'false', label: 'Se não' },
    ];
  }
  if (step.action?.type === 'goToFlow') {
    return [];
  }
  return [{ id: 'next', label: 'Depois' }];
}

export function flowCanvasLinks(steps: FlowStep[]): FlowCanvasLink[] {
  const visible = visibleStepIds(steps);
  const links: FlowCanvasLink[] = [];

  for (const { step } of visibleFlowSteps(steps)) {
    if (step.type === 'question') {
      const options = listQuestionOptions(step);
      if (options.length > 0) {
        options.forEach((option, index) => {
          const targetId = trueStepIdForOption(steps, step, option);
          if (targetId && visible.has(targetId)) {
            links.push({
              sourceId: step.id,
              sourceHandle: `option:${index}`,
              targetId,
              label: option,
            });
          }
        });
        continue;
      }
    }
    if (step.type === 'condition' && step.condition) {
      if (step.condition.trueStepId && visible.has(step.condition.trueStepId)) {
        links.push({
          sourceId: step.id,
          sourceHandle: 'true',
          targetId: step.condition.trueStepId,
          label: 'Se sim',
        });
      }
      if (step.condition.falseStepId && visible.has(step.condition.falseStepId)) {
        links.push({
          sourceId: step.id,
          sourceHandle: 'false',
          targetId: step.condition.falseStepId,
          label: 'Se não',
        });
      }
      continue;
    }
    if (step.action?.type === 'goToFlow') {
      continue;
    }
    if (step.nextStepId && visible.has(step.nextStepId)) {
      links.push({
        sourceId: step.id,
        sourceHandle: 'next',
        targetId: step.nextStepId,
        label: 'Depois',
      });
    }
  }

  return links;
}

export function setCanvasPosition(
  steps: FlowStep[],
  stepId: string,
  position: { x: number; y: number }
): FlowStep[] {
  return steps.map((step) =>
    step.id === stepId ? { ...step, canvasPosition: position } : step
  );
}

export function setStepLink(
  steps: FlowStep[],
  sourceId: string,
  sourceHandle: string,
  targetId: string
): FlowStep[] {
  if (sourceId && sourceId === targetId) {
    return steps;
  }
  const source = steps.find((step) => step.id === sourceId);
  if (!source) {
    return steps;
  }

  if (sourceHandle.startsWith('option:')) {
    const index = Number(sourceHandle.slice('option:'.length));
    const option = listQuestionOptions(source)[index];
    if (!option) {
      return steps;
    }
    return setOptionTrueStepId(steps, sourceId, option, targetId);
  }

  if (sourceHandle === 'true' || sourceHandle === 'false') {
    if (!source.condition) {
      return steps;
    }
    const key = sourceHandle === 'true' ? 'trueStepId' : 'falseStepId';
    return steps.map((step) =>
      step.id === sourceId && step.condition
        ? { ...step, condition: { ...step.condition, [key]: targetId } }
        : step
    );
  }

  return steps.map((step) =>
    step.id === sourceId ? { ...step, nextStepId: targetId || undefined } : step
  );
}
