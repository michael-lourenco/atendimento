import { Flow, FlowStep } from '../entities/Flow';
import { planFlowTurn } from './planFlowTurn';

export function previewFlowOpening(
  steps: FlowStep[],
  now = new Date(0),
  catalog: Flow[] = []
): string[] {
  if (steps.length === 0) {
    return [];
  }
  const flow: Flow = {
    id: 'preview',
    name: 'preview',
    isActive: true,
    steps,
    createdAt: now,
    updatedAt: now,
  };
  return planFlowTurn({
    flow,
    flows: catalog.length > 0 ? [flow, ...catalog] : undefined,
    session: null,
    contactId: 'preview',
    incomingText: 'oi',
    now,
  }).replies.map((reply) => reply.content);
}
