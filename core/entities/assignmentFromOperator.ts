import { Agent } from './Agent';

export type OperatorAssignment = {
  agentId: string;
  agentName: string;
  departmentId?: string;
  linked: boolean;
};

export function assignmentFromOperator(
  user: { id: string; email: string; name: string },
  agents: Agent[]
): OperatorAssignment {
  const email = user.email.trim().toLowerCase();
  const match =
    agents.find((agent) => agent.id === user.id) ??
    agents.find((agent) => agent.email.trim().toLowerCase() === email);
  return {
    agentId: match?.id ?? user.id,
    agentName: match?.name ?? user.name,
    departmentId: match?.departmentId,
    linked: Boolean(match),
  };
}
