import { Flow, FlowStep } from '../entities/Flow';
import { FlowSession } from '../entities/FlowSession';
import { evaluateCondition } from './evaluateCondition';
import { resolveQuestionChoice } from './resolveQuestionChoice';

export const MAX_FLOW_STEPS_PER_TURN = 20;

export interface FlowReply {
  content: string;
  stepId: string;
  flowId: string;
}

export type FlowEffect = {
  type: 'setDepartment';
  departmentId: string;
};

export interface FlowTurnPlan {
  replies: FlowReply[];
  effects: FlowEffect[];
  nextSession: FlowSession;
}

export function formatQuestion(step: FlowStep): string {
  if (!step.options?.length) {
    return step.content;
  }

  const optionLines = step.options.map((option, index) => `${index + 1}. ${option}`);
  return [step.content, ...optionLines].filter(Boolean).join('\n');
}

function findStep(flow: Flow, stepId?: string): FlowStep | null {
  if (!stepId) {
    return null;
  }
  return flow.steps.find((step) => step.id === stepId) ?? null;
}

function firstQuestionStep(flow: Flow): FlowStep | null {
  return flow.steps.find((step) => step.type === 'question') ?? flow.steps[0] ?? null;
}

function initialCursor(flow: Flow, session: FlowSession | null): FlowStep | null {
  const firstStep = flow.steps[0] ?? null;
  if (!session) {
    return firstStep;
  }
  if (!session.currentStepId) {
    return firstQuestionStep(flow);
  }

  const waiting = findStep(flow, session.currentStepId);
  if (!waiting) {
    return firstQuestionStep(flow);
  }

  if (waiting.type === 'question') {
    return findStep(flow, waiting.nextStepId);
  }

  return waiting;
}

function resolveGoToFlow(catalog: Flow[], flowId: string, visited: Set<string>): Flow | null {
  const targetId = flowId.trim();
  if (!targetId || visited.has(targetId)) {
    return null;
  }
  const target = catalog.find((item) => item.id === targetId);
  if (!target?.isActive) {
    return null;
  }
  return target;
}

export function planFlowTurn(input: {
  flow: Flow;
  flows?: Flow[];
  session: FlowSession | null;
  contactId: string;
  incomingText: string;
  now: Date;
}): FlowTurnPlan {
  const { session, contactId, incomingText, now } = input;
  const catalog = input.flows?.length ? input.flows : [input.flow];
  let active = input.flow;
  const replies: FlowReply[] = [];
  const effects: FlowEffect[] = [];
  const visitedFlows = new Set<string>([active.id]);
  const waiting = session?.currentStepId ? findStep(active, session.currentStepId) : null;
  const replyText =
    waiting?.type === 'question' ? resolveQuestionChoice(waiting, incomingText) : incomingText;
  let cursor = initialCursor(active, session);
  let waitingStepId: string | null = null;
  let steps = 0;

  while (cursor && steps < MAX_FLOW_STEPS_PER_TURN) {
    steps += 1;

    if (cursor.type === 'action' && cursor.action?.type === 'goToFlow') {
      const target = resolveGoToFlow(catalog, cursor.action.flowId, visitedFlows);
      if (!target) {
        cursor = findStep(active, cursor.nextStepId);
        continue;
      }
      visitedFlows.add(target.id);
      active = target;
      cursor = active.steps[0] ?? null;
      continue;
    }

    if (cursor.type === 'action' && cursor.action?.type === 'setDepartment') {
      const departmentId = cursor.action.departmentId.trim();
      if (departmentId) {
        effects.push({ type: 'setDepartment', departmentId });
      }
      cursor = findStep(active, cursor.nextStepId);
      continue;
    }

    if (cursor.type === 'message' || cursor.type === 'action') {
      if (cursor.content.trim()) {
        replies.push({ content: cursor.content, stepId: cursor.id, flowId: active.id });
      }
      cursor = findStep(active, cursor.nextStepId);
      continue;
    }

    if (cursor.type === 'question') {
      replies.push({ content: formatQuestion(cursor), stepId: cursor.id, flowId: active.id });
      waitingStepId = cursor.id;
      break;
    }

    if (cursor.type === 'condition') {
      if (!cursor.condition) {
        cursor = null;
        break;
      }
      const matched = evaluateCondition(cursor.condition, replyText);
      const nextId = matched ? cursor.condition.trueStepId : cursor.condition.falseStepId;
      cursor = findStep(active, nextId);
      continue;
    }

    cursor = null;
  }

  return {
    replies,
    effects,
    nextSession: {
      contactId,
      flowId: active.id,
      currentStepId: waitingStepId,
      paused: false,
      updatedAt: now,
    },
  };
}
