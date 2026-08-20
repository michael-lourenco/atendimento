import { FlowSession } from './FlowSession';
import { FlowAudience } from './flowAudience';

export function shouldSkipPausedSession(session: FlowSession | null, reopened: boolean): boolean {
  return Boolean(session?.paused) && !reopened;
}

export function sessionForKnownMenu(
  session: FlowSession | null,
  contactId: string,
  now: Date,
  entryFlowId?: string
): FlowSession {
  return {
    contactId,
    flowId: session?.flowId ?? entryFlowId ?? 'inicio',
    currentStepId: null,
    paused: false,
    updatedAt: now,
  };
}

export function planSessionForTurn(input: {
  session: FlowSession | null;
  audience: FlowAudience;
  reopened: boolean;
  contactId: string;
  now: Date;
  entryFlowId?: string;
}): { session: FlowSession | null; skip: boolean } {
  if (shouldSkipPausedSession(input.session, input.reopened)) {
    return { session: input.session, skip: true };
  }
  if (input.reopened && input.audience === 'known') {
    return {
      session: sessionForKnownMenu(input.session, input.contactId, input.now, input.entryFlowId),
      skip: false,
    };
  }
  if (input.audience === 'known' && !input.session?.currentStepId) {
    return {
      session: sessionForKnownMenu(input.session, input.contactId, input.now, input.entryFlowId),
      skip: false,
    };
  }
  if (input.reopened) {
    return { session: null, skip: false };
  }
  return { session: input.session, skip: false };
}
