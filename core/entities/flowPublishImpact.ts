import { FlowSession } from './FlowSession';

export function countSessionsOnRemovedSteps(
  sessions: Pick<FlowSession, 'currentStepId'>[],
  nextStepIds: Iterable<string>
): number {
  const keep = new Set([...nextStepIds].filter(Boolean));
  return sessions.filter((session) => {
    const stepId = session.currentStepId?.trim();
    return Boolean(stepId) && !keep.has(stepId);
  }).length;
}
