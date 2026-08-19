import { Agent } from './Agent';
import { User } from './User';

export function agentFromUser(user: User, departmentId?: string): Agent {
  const name = user.name.trim() || user.email.split('@')[0] || 'Atendente';
  return {
    id: user.id,
    name,
    email: user.email,
    status: 'online',
    departmentId,
    conversationsCount: 0,
    responseTime: '—',
    createdAt: user.createdAt,
  };
}
