import { Flow, FlowStep } from './Flow';

export const DEFAULT_MISS_HANDOFF =
  'Vou te passar para uma pessoa da equipe.';

export function flowStepsForEngine(flow: Pick<Flow, 'steps' | 'publishedSteps'>): FlowStep[] {
  const published = flow.publishedSteps;
  if (Array.isArray(published) && published.length > 0) {
    return published;
  }
  return flow.steps;
}

export function flowsForEngine(flows: Flow[]): Flow[] {
  return flows.map((flow) => ({ ...flow, steps: flowStepsForEngine(flow) }));
}

export function flowHasUnpublishedChanges(flow: {
  steps: unknown[];
  publishedSteps?: unknown[] | null;
}): boolean {
  if (!flow.publishedSteps) {
    return true;
  }
  return JSON.stringify(flow.steps) !== JSON.stringify(flow.publishedSteps);
}
