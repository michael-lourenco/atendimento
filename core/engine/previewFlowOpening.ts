import { Flow, FlowStep } from '../entities/Flow';
import { FlowAudience } from '../entities/flowAudience';
import { sessionForKnownMenu } from '../entities/flowAudienceSession';
import { FlowReply, FlowTurnPlan, planFlowTurn } from './planFlowTurn';

export function previewFlowTurn(
  steps: FlowStep[],
  now = new Date(0),
  catalog: Flow[] = [],
  audience: FlowAudience = 'new',
  flowId = 'preview'
): FlowTurnPlan {
  const flow: Flow = {
    id: flowId,
    name: 'preview',
    isActive: true,
    steps,
    createdAt: now,
    updatedAt: now,
  };
  const session =
    audience === 'known' ? sessionForKnownMenu(null, 'preview', now, flowId) : null;
  return planFlowTurn({
    flow,
    flows: catalog.length > 0 ? [flow, ...catalog.filter((item) => item.id !== flowId)] : undefined,
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
