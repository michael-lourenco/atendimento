import { FlowStep } from '../entities/Flow';
import { conditionsOwnedByQuestion } from './flowOptionPaths';

export function ownedConditionIds(steps: FlowStep[]): Set<string> {
  const ids = new Set<string>();
  for (const step of steps) {
    for (const condition of conditionsOwnedByQuestion(steps, step)) {
      ids.add(condition.id);
    }
  }
  return ids;
}

export function visibleFlowSteps(steps: FlowStep[]): { step: FlowStep; index: number }[] {
  const owned = ownedConditionIds(steps);
  return steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => !owned.has(step.id));
}
