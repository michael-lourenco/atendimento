import { Flow, FlowStep } from '../entities/Flow';
import { FlowSession } from '../entities/FlowSession';
import { FlowAudience } from '../entities/flowAudience';
import { sessionForKnownMenu, shouldSkipPausedSession } from '../entities/flowAudienceSession';
import { FlowReply, FlowTurnPlan, planFlowTurn } from './planFlowTurn';
import { resolveActiveFlow } from './resolveActiveFlow';

function previewFlow(steps: FlowStep[], flowId: string, now: Date, base?: Flow): Flow {
  return {
    id: flowId,
    name: base?.name ?? 'preview',
    isActive: base?.isActive ?? true,
    steps,
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
    keywords: base?.keywords,
  };
}

export function overlayEditorOnCatalog(
  catalog: Flow[],
  flowId: string,
  steps: FlowStep[],
  now = new Date(0)
): Flow[] {
  const base = catalog.find((item) => item.id === flowId);
  const overlay = previewFlow(steps, flowId, now, base);
  return [overlay, ...catalog.filter((item) => item.id !== flowId)];
}

function previewCatalog(flow: Flow, catalog: Flow[]): Flow[] {
  return [flow, ...catalog.filter((item) => item.id !== flow.id)];
}

export function previewFlowTurn(
  steps: FlowStep[],
  now = new Date(0),
  catalog: Flow[] = [],
  audience: FlowAudience = 'new',
  flowId = 'preview'
): FlowTurnPlan {
  const flow = previewFlow(steps, flowId, now, catalog.find((item) => item.id === flowId));
  const session =
    audience === 'known' ? sessionForKnownMenu(null, 'preview', now, flowId) : null;
  return planFlowTurn({
    flow,
    flows: catalog.length > 0 ? previewCatalog(flow, catalog) : undefined,
    session,
    contactId: 'preview',
    incomingText: 'oi',
    now,
  });
}

export function previewFlowOpening(
  steps: FlowStep[],
  now = new Date(0),
  catalog: Flow[] = [],
  audience: FlowAudience = 'new',
  flowId = 'preview'
): FlowReply[] {
  if (steps.length === 0) {
    return [];
  }
  return previewFlowTurn(steps, now, catalog, audience, flowId).replies;
}

export type SimulatedFlowTurn = {
  replies: FlowReply[];
  nextSession: FlowSession;
  skipped: boolean;
};

export function simulateFlowIncoming(input: {
  steps: FlowStep[];
  catalog?: Flow[];
  flowId?: string;
  session: FlowSession | null;
  incomingText: string;
  now?: Date;
}): SimulatedFlowTurn | null {
  const incoming = input.incomingText.trim();
  if (!incoming) {
    return null;
  }
  if (shouldSkipPausedSession(input.session, false) && input.session) {
    return {
      replies: [],
      nextSession: input.session,
      skipped: true,
    };
  }
  if (!input.session && input.steps.length === 0) {
    return null;
  }
  const now = input.now ?? new Date(0);
  const flowId = input.flowId ?? 'preview';
  const catalog = overlayEditorOnCatalog(input.catalog ?? [], flowId, input.steps, now);
  const flow =
    resolveActiveFlow(catalog, {
      sessionFlowId: input.session?.flowId,
      entryFlowId: flowId,
    }) ?? previewFlow(input.steps, flowId, now);
  const plan = planFlowTurn({
    flow,
    flows: catalog,
    session: input.session,
    contactId: 'preview',
    incomingText: incoming,
    now,
  });
  return {
    replies: plan.replies,
    nextSession: plan.nextSession,
    skipped: false,
  };
}
