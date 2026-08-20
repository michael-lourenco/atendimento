import { Flow } from '../entities/Flow';

export type ResolveActiveFlowHint = {
  sessionFlowId?: string;
  entryFlowId?: string;
};

export function resolveActiveFlow(
  flows: Flow[],
  hint: ResolveActiveFlowHint = {}
): Flow | null {
  const active = flows.filter((flow) => flow.isActive);

  if (hint.sessionFlowId) {
    const current = active.find((flow) => flow.id === hint.sessionFlowId);
    if (current) {
      return current;
    }
  }

  if (hint.entryFlowId) {
    const preferred = active.find((flow) => flow.id === hint.entryFlowId);
    if (preferred) {
      return preferred;
    }
  }

  return (
    active.find((flow) => flow.id === 'inicio') ??
    active.find((flow) => flow.name === 'Atendimento Inicial') ??
    active[0] ??
    null
  );
}
