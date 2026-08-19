import { FlowStep } from '@/core/entities/Flow';
import { END_STEP_LABEL, stepDisplayName } from './flow-step-copy';

export type FlowPathLink = {
  fromId: string;
  fromLabel: string;
  label: string;
  toLabel: string;
};

function labelOf(
  steps: FlowStep[],
  id: string,
  departments: { id: string; name: string }[]
): string {
  if (!id) {
    return END_STEP_LABEL;
  }
  const index = steps.findIndex((step) => step.id === id);
  if (index < 0) {
    return END_STEP_LABEL;
  }
  return stepDisplayName(steps[index], index, departments);
}

export function flowPathLinks(
  steps: FlowStep[],
  departments: { id: string; name: string }[] = []
): FlowPathLink[] {
  const links: FlowPathLink[] = [];
  steps.forEach((step, index) => {
    const fromLabel = stepDisplayName(step, index, departments);
    if (step.type === 'condition' && step.condition) {
      links.push({
        fromId: step.id,
        fromLabel,
        label: 'Se sim',
        toLabel: labelOf(steps, step.condition.trueStepId, departments),
      });
      links.push({
        fromId: `${step.id}-false`,
        fromLabel,
        label: 'Se não',
        toLabel: labelOf(steps, step.condition.falseStepId, departments),
      });
      return;
    }
    links.push({
      fromId: step.id,
      fromLabel,
      label: 'Depois',
      toLabel: labelOf(steps, step.nextStepId ?? '', departments),
    });
  });
  return links;
}
