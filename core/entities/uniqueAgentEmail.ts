import { Agent } from './Agent';

export function normalizeAgentEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findAgentByEmail(agents: Agent[], email: string): Agent | undefined {
  const needle = normalizeAgentEmail(email);
  if (!needle) {
    return undefined;
  }
  return agents.find((agent) => normalizeAgentEmail(agent.email) === needle);
}

export function agentEmailTaken(agents: Agent[], email: string, ignoreId?: string): boolean {
  const found = findAgentByEmail(agents, email);
  return Boolean(found && found.id !== ignoreId);
}
