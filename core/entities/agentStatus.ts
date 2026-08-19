import { Agent } from './Agent';
import { User } from './User';
import { isAdmin } from './operatorRole';

export function agentIsOnline(agent: Pick<Agent, 'status'>): boolean {
  return agent.status !== 'offline';
}

export function operatorForAgent(
  agent: Pick<Agent, 'id' | 'email'>,
  operators: User[]
): User | undefined {
  const email = agent.email.trim().toLowerCase();
  return (
    operators.find((item) => item.id === agent.id) ??
    operators.find((item) => item.email.trim().toLowerCase() === email)
  );
}

export function canSetAgentOffline(
  actor: User | null,
  target: Agent,
  agents: Agent[],
  operators: User[]
): boolean {
  if (!actor || !isAdmin(actor) || actor.id === target.id) {
    return false;
  }
  const targetOperator = operatorForAgent(target, operators);
  if (targetOperator?.role !== 'admin') {
    return true;
  }
  const onlineAdmins = agents.filter(
    (agent) => agentIsOnline(agent) && operatorForAgent(agent, operators)?.role === 'admin'
  );
  const targetIsLastOnlineAdmin =
    onlineAdmins.length === 1 && onlineAdmins[0].id === target.id;
  return !targetIsLastOnlineAdmin;
}
