import { Agent } from '../entities/Agent';
import { agentFromUser } from '../entities/agentFromUser';
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
    const byEmail = (await this.agents.getAll()).find(
      (agent) => agent.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    );
    if (byEmail) {
      return byEmail;
    }
    const agent = agentFromUser(user);
    await this.agents.save(agent);
    return agent;
  }
}
