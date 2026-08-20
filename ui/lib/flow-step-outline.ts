import { FlowStep } from '@/core/entities/Flow';
import { visibleFlowSteps } from '@/core/engine/visibleFlowSteps';
import { conditionsOwnedByQuestion, trueStepIdForOption } from './flow-option-paths';
import { removeFlowStep } from './flow-step-graph';
import { END_STEP_LABEL, stepDisplayName } from './flow-step-copy';

export { ownedConditionIds, visibleFlowSteps } from '@/core/engine/visibleFlowSteps';

export function optionBranchLabel(
  steps: FlowStep[],
  question: FlowStep,
  option: string,
  departments: { id: string; name: string }[] = [],
  flows: { id: string; name: string }[] = []
): string {
  if (conditionsOwnedByQuestion(steps, question).length === 0) {
    return 'Ainda sem destino — aplique as opções no roteiro';
  }
  const trueId = trueStepIdForOption(steps, question, option);
  if (!trueId) {
    return `Vai para: ${END_STEP_LABEL}`;
  }
  const destIndex = steps.findIndex((step) => step.id === trueId);
  if (destIndex < 0) {
    return `Vai para: ${END_STEP_LABEL}`;
  }
  const visIndex = visibleFlowSteps(steps).findIndex((item) => item.step.id === trueId);
  const displayIndex = visIndex >= 0 ? visIndex : destIndex;
  return `Vai para: ${stepDisplayName(steps[destIndex], displayIndex, departments, flows)}`;
}

export function moveVisibleFlowStep(
  steps: FlowStep[],
  stepId: string,
  direction: -1 | 1
): FlowStep[] {
  const visible = visibleFlowSteps(steps);
  const visIndex = visible.findIndex((item) => item.step.id === stepId);
  const target = visIndex + direction;
  if (visIndex < 0 || target < 0 || target >= visible.length) {
    return steps;
  }
  const next = [...steps];
  const from = visible[visIndex].index;
  const to = visible[target].index;
  const swap = next[from];
  next[from] = next[to];
  next[to] = swap;
  return next;
}

export function removeVisibleFlowStep(steps: FlowStep[], stepId: string): FlowStep[] {
  const step = steps.find((item) => item.id === stepId);
  const ownedIds = step ? conditionsOwnedByQuestion(steps, step).map((item) => item.id) : [];
  let next = steps;
  for (const id of [...ownedIds, stepId]) {
    const index = next.findIndex((item) => item.id === id);
    if (index >= 0) {
      next = removeFlowStep(next, index);
    }
  }
  return next;
}
