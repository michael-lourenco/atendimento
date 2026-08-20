import { Flow } from './Flow';

export function duplicateFlow(flow: Flow, now = new Date()): Flow {
  return {
    ...flow,
    id: `flow-${now.getTime()}`,
    name: `${flow.name.trim() || 'Fluxo'} (cópia)`,
    isActive: false,
    createdAt: now,
    updatedAt: now,
  };
}
