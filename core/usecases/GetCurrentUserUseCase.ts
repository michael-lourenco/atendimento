import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { User } from '../entities/User';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { EnsureOperatorAgentUseCase } from './EnsureOperatorAgentUseCase';

export class GetCurrentUserUseCase {
  constructor(
    private repository: IAuthRepository = serviceLocator.getAuthRepository(),
    private ensureAgent: EnsureOperatorAgentUseCase = new EnsureOperatorAgentUseCase()
  ) {}

  async execute(): Promise<User | null> {
    const user = await this.repository.getCurrentUser();
    if (user) {
      await this.ensureAgent.execute(user);
    }
    return user;
  }
}
