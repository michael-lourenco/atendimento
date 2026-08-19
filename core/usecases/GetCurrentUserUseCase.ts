import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { User } from '../entities/User';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { EnsureOperatorAgentUseCase } from './EnsureOperatorAgentUseCase';
import { rejectOfflineAgent } from './rejectOfflineAgent';

export class GetCurrentUserUseCase {
  constructor(
    private repository: IAuthRepository = serviceLocator.getAuthRepository(),
    private ensureAgent: EnsureOperatorAgentUseCase = new EnsureOperatorAgentUseCase(),
    private agents: IAgentRepository = serviceLocator.getAgentRepository()
  ) {}

  async execute(): Promise<User | null> {
    const user = await this.repository.getCurrentUser();
    if (!user) {
      return null;
    }
    await this.ensureAgent.execute(user);
    await rejectOfflineAgent(user, this.agents, this.repository);
    return user;
  }
}
