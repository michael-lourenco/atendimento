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
  departments: { id: string; name: string }[],
  flows: { id: string; name: string }[] = []
): string {
  if (!id) {
    return END_STEP_LABEL;
  }
  const index = steps.findIndex((step) => step.id === id);
  if (index < 0) {
    return END_STEP_LABEL;
  }
  return stepDisplayName(steps[index], index, departments, flows);
}

export function flowPathLinks(
  steps: FlowStep[],
  departments: { id: string; name: string }[] = [],
  flows: { id: string; name: string }[] = []
): FlowPathLink[] {
  const links: FlowPathLink[] = [];
  steps.forEach((step, index) => {
    const fromLabel = stepDisplayName(step, index, departments, flows);
    if (step.type === 'condition' && step.condition) {
      links.push({
        fromId: step.id,
        fromLabel,
        label: 'Se sim',
        toLabel: labelOf(steps, step.condition.trueStepId, departments, flows),
      });
      links.push({
        fromId: `${step.id}-false`,
        fromLabel,
        label: 'Se não',
        toLabel: labelOf(steps, step.condition.falseStepId, departments, flows),
      });
      return;
    }
    if (step.action?.type === 'goToFlow') {
      const flowId = step.action.flowId;
      const targetName = flows.find((item) => item.id === flowId)?.name || 'fluxo';
      links.push({
        fromId: step.id,
        fromLabel,
        label: 'Salta',
        toLabel: targetName,
      });
      return;
    }
    links.push({
      fromId: step.id,
      fromLabel,
      label: 'Depois',
      toLabel: labelOf(steps, step.nextStepId ?? '', departments, flows),
    });
  });
  return links;
}
