import { Agent } from '../entities/Agent';
import { findAgentByEmail } from '../entities/uniqueAgentEmail';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { LoginDeniedError } from '../entities/loginDenied';

export async function rejectOfflineAgent(
  user: { id: string; email: string },
  agents: IAgentRepository,
  auth: IAuthRepository
): Promise<void> {
  const byId = await agents.getById(user.id);
  const agent = byId ?? findAgentByEmail(await agents.getAll(), user.email);
  if (agent?.status === 'offline') {
    await auth.logout();
    throw new LoginDeniedError();
  }
}
