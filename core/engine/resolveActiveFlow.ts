import { Flow } from '../entities/Flow';

export function resolveActiveFlow(flows: Flow[], sessionFlowId?: string): Flow | null {
  const active = flows.filter((flow) => flow.isActive);

  if (sessionFlowId) {
    const current = active.find((flow) => flow.id === sessionFlowId);
    if (current) {
      return current;
    }
  }

  return (
    active.find((flow) => flow.id === 'inicio') ??
    active.find((flow) => flow.name === 'Atendimento Inicial') ??
    active[0] ??
    null
  );
}
