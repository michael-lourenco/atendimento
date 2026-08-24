import { FlowTurnPlan } from './planFlowTurn';
import { FlowSession } from '../entities/FlowSession';
import { DEFAULT_MISS_HANDOFF } from '../entities/flowPublish';
import { nextMissStreak, shouldHandoffAfterMiss } from '../entities/flowSessionTurn';

export function decorateFlowTurn(input: {
  plan: FlowTurnPlan;
  session: FlowSession | null;
  consumedAt: Date;
  missAfter: number;
  departmentId?: string;
  now: Date;
}): FlowTurnPlan {
  const missStreak = nextMissStreak(
    input.plan.unmatchedQuestion,
    input.plan.matchedChoice,
    input.session?.missStreak ?? 0
  );
  const nextSession = {
    ...input.plan.nextSession,
    consumedIncomingAt: input.consumedAt,
    missStreak,
    mediaHintStepId: input.session?.mediaHintStepId,
    outsideHoursNotified: false,
  };
  if (!shouldHandoffAfterMiss(missStreak, input.missAfter)) {
    return { ...input.plan, nextSession };
  }
  return {
    replies: [
      {
        content: DEFAULT_MISS_HANDOFF,
        stepId: 'handoff',
        flowId: input.plan.nextSession.flowId,
      },
    ],
    effects: input.departmentId
      ? [{ type: 'setDepartment', departmentId: input.departmentId }]
      : [],
    unmatchedQuestion: true,
    matchedChoice: false,
    nextSession: {
      ...nextSession,
      currentStepId: null,
      paused: true,
      missStreak: 0,
      mediaHintStepId: undefined,
      updatedAt: input.now,
    },
  };
}
