import { Flow, FlowStep } from '../entities/Flow';
import { planFlowTurn } from './planFlowTurn';

export function previewFlowOpening(steps: FlowStep[], now = new Date(0)): string[] {
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
    session: null,
    contactId: 'preview',
    incomingText: 'oi',
    now,
  }).replies.map((reply) => reply.content);
}
