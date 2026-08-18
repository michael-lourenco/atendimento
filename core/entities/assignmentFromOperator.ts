import { Agent } from './Agent';

export function assignmentFromOperator(
  user: { id: string; email: string; name: string },
  agents: Agent[]
): { agentId: string; agentName: string } {
  const email = user.email.trim().toLowerCase();
  const match = agents.find((agent) => agent.email.trim().toLowerCase() === email);
  return {
    agentId: match?.id ?? user.id,
    agentName: match?.name ?? user.name,
  };
}
