import { Agent } from '../entities/Agent';
import { agentFromUser } from '../entities/agentFromUser';
import { findAgentByEmail } from '../entities/uniqueAgentEmail';
import { User } from '../entities/User';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class EnsureOperatorAgentUseCase {
  constructor(private agents: IAgentRepository = serviceLocator.getAgentRepository()) {}

  async execute(user: User): Promise<Agent> {
    const byId = await this.agents.getById(user.id);
    if (byId) {
      return byId;
    }
    const byEmail = findAgentByEmail(await this.agents.getAll(), user.email);
    if (byEmail) {
      return byEmail;
    }
    const agent = agentFromUser(user);
    await this.agents.save(agent);
    return agent;
  }
}
