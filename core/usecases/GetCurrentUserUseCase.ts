import { User } from '../entities/User';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { EnsureOperatorAgentUseCase } from './EnsureOperatorAgentUseCase';
import { rejectOfflineAgent } from './rejectOfflineAgent';

export class GetCurrentUserUseCase {
  constructor(
    private repository: IAuthRepository,
    private ensureAgent: EnsureOperatorAgentUseCase,
    private agents: IAgentRepository
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
