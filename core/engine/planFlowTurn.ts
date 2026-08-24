import { Flow, FlowStep, FlowStepMediaKind } from '../entities/Flow';
import { FlowReturnFrame, FlowSession } from '../entities/FlowSession';
import { evaluateCondition } from './evaluateCondition';
import { resolveQuestionChoice } from './resolveQuestionChoice';
import { matchFlowByKeyword } from './matchFlowByKeyword';
import { clampFlowDelayMs } from './clampFlowDelayMs';
import { matchesHumanHandoff } from '../entities/humanHandoff';
import { DEFAULT_MISS_HANDOFF } from '../entities/flowPublish';

export const MAX_FLOW_STEPS_PER_TURN = 20;

export interface FlowReply {
  content: string;
  stepId: string;
  flowId: string;
  delayMs?: number;
  mediaUrl?: string;
  mediaKind?: FlowStepMediaKind;
}

export type FlowEffect = {
  type: 'setDepartment';
  departmentId: string;
};

export interface FlowTurnPlan {
  replies: FlowReply[];
  effects: FlowEffect[];
  nextSession: FlowSession;
  unmatchedQuestion: boolean;
  matchedChoice: boolean;
}

export function formatQuestion(step: FlowStep): string {
  if (!step.options?.length) {
    return step.content;
  }
  const optionLines = step.options.map((option, index) => `${index + 1}. ${option}`);
  return [step.content, ...optionLines].filter(Boolean).join('\n');
}

function findStep(flow: Flow, stepId?: string | null): FlowStep | null {
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

function incomingMatchesQuestionOption(question: FlowStep, incomingText: string): boolean {
  const resolved = resolveQuestionChoice(question, incomingText);
  if (resolved !== incomingText) {
    return true;
  }
  const needle = incomingText.trim().toLowerCase();
  return (question.options ?? []).some((option) => option.trim().toLowerCase() === needle);
}

function pushMessageReply(replies: FlowReply[], step: FlowStep, flowId: string): void {
  const content = step.content.trim();
  const mediaUrl = step.mediaUrl?.trim();
  if (!content && !mediaUrl) {
    return;
  }
  const delayMs = clampFlowDelayMs(step.delayMs);
  replies.push({
    content,
    stepId: step.id,
    flowId,
    ...(delayMs ? { delayMs } : {}),
    ...(mediaUrl ? { mediaUrl, mediaKind: step.mediaKind ?? 'image' } : {}),
  });
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
  let stack: FlowReturnFrame[] = [...(session?.returnStack ?? [])];
  const waiting = session?.currentStepId ? findStep(active, session.currentStepId) : null;
  if (matchesHumanHandoff(incomingText)) {
    return {
      replies: [
        {
          content: DEFAULT_MISS_HANDOFF,
          stepId: 'handoff',
          flowId: active.id,
        },
      ],
      effects: [],
      unmatchedQuestion: false,
      matchedChoice: true,
      nextSession: {
        contactId,
        flowId: active.id,
        currentStepId: null,
        paused: true,
        updatedAt: now,
      },
    };
  }
  const optionLocked = waiting?.type === 'question' && incomingMatchesQuestionOption(waiting, incomingText);
  const replyText =
    waiting?.type === 'question' ? resolveQuestionChoice(waiting, incomingText) : incomingText;

  const keywordFlow = optionLocked
    ? null
    : matchFlowByKeyword(catalog, incomingText, session?.flowId ?? active.id);
  let cursor: FlowStep | null;
  if (keywordFlow) {
    active = keywordFlow;
    stack = [];
    visitedFlows.clear();
    visitedFlows.add(active.id);
    cursor = active.steps[0] ?? null;
  } else {
    cursor = initialCursor(active, session);
  }

  let waitingStepId: string | null = null;
  let paused = false;
  let steps = 0;

  while (steps < MAX_FLOW_STEPS_PER_TURN) {
    if (!cursor) {
      const frame = stack.pop();
      if (!frame) {
        break;
      }
      const origin = catalog.find((item) => item.id === frame.flowId && item.isActive);
      if (!origin) {
        continue;
      }
      active = origin;
      cursor = findStep(active, frame.resumeStepId);
      continue;
    }

    steps += 1;

    if (cursor.type === 'action' && cursor.action?.type === 'goToFlow') {
      const target = resolveGoToFlow(catalog, cursor.action.flowId, visitedFlows);
      if (!target) {
        cursor = findStep(active, cursor.nextStepId);
        continue;
      }
      if (cursor.nextStepId) {
        stack.push({ flowId: active.id, resumeStepId: cursor.nextStepId });
      }
      visitedFlows.add(target.id);
      active = target;
      cursor = active.steps[0] ?? null;
      continue;
    }

    if (cursor.type === 'action' && cursor.action?.type === 'handoff') {
      const departmentId = cursor.action.departmentId?.trim();
      if (departmentId) {
        effects.push({ type: 'setDepartment', departmentId });
      }
      if (cursor.content.trim()) {
        pushMessageReply(replies, cursor, active.id);
      }
      paused = true;
      waitingStepId = null;
      break;
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
      pushMessageReply(replies, cursor, active.id);
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
        continue;
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
    unmatchedQuestion: Boolean(waiting?.type === 'question' && !optionLocked && !keywordFlow),
    matchedChoice: Boolean(optionLocked || keywordFlow),
    nextSession: {
      contactId,
      flowId: active.id,
      currentStepId: waitingStepId,
      paused,
      updatedAt: now,
      ...(stack.length > 0 ? { returnStack: stack } : {}),
    },
  };
}
