import { Flow, FlowStep } from '../entities/Flow';
import { FlowSession } from '../entities/FlowSession';
import { evaluateCondition } from './evaluateCondition';

export const MAX_FLOW_STEPS_PER_TURN = 20;

export interface FlowReply {
  content: string;
  stepId: string;
}

export interface FlowTurnPlan {
  replies: FlowReply[];
  nextSession: FlowSession;
}

export function formatQuestion(step: FlowStep): string {
  if (!step.options?.length) {
    return step.content;
  }

  const optionLines = step.options.map((option) => `- ${option}`);
  return [step.content, ...optionLines].filter(Boolean).join('\n');
}

function findStep(flow: Flow, stepId?: string): FlowStep | null {
  if (!stepId) {
    return null;
  }
  return flow.steps.find((step) => step.id === stepId) ?? null;
}

function initialCursor(flow: Flow, session: FlowSession | null): FlowStep | null {
  const firstStep = flow.steps[0] ?? null;
  if (!session?.currentStepId) {
    return firstStep;
  }

  const waiting = findStep(flow, session.currentStepId);
  if (!waiting) {
    return firstStep;
  }

  if (waiting.type === 'question') {
    return findStep(flow, waiting.nextStepId);
  }

  return waiting;
}

export function planFlowTurn(input: {
  flow: Flow;
  session: FlowSession | null;
  contactId: string;
  incomingText: string;
  now: Date;
}): FlowTurnPlan {
  const { flow, session, contactId, incomingText, now } = input;
  const replies: FlowReply[] = [];
  let cursor = initialCursor(flow, session);
  let waitingStepId: string | null = null;
  let steps = 0;

  while (cursor && steps < MAX_FLOW_STEPS_PER_TURN) {
    steps += 1;

    if (cursor.type === 'message' || cursor.type === 'action') {
      if (cursor.content.trim()) {
        replies.push({ content: cursor.content, stepId: cursor.id });
      }
      cursor = findStep(flow, cursor.nextStepId);
      continue;
    }

    if (cursor.type === 'question') {
      replies.push({ content: formatQuestion(cursor), stepId: cursor.id });
      waitingStepId = cursor.id;
      break;
    }

    if (cursor.type === 'condition') {
      if (!cursor.condition) {
        cursor = null;
        break;
      }
      const matched = evaluateCondition(cursor.condition, incomingText);
      const nextId = matched ? cursor.condition.trueStepId : cursor.condition.falseStepId;
      cursor = findStep(flow, nextId);
      continue;
    }

    cursor = null;
  }

  return {
    replies,
    nextSession: {
      contactId,
      flowId: flow.id,
      currentStepId: waitingStepId,
      updatedAt: now,
    },
  };
}
