import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { AuthUser } from '../entities/User';
import { LoginDeniedError } from '../entities/loginDenied';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { rejectOfflineAgent } from './rejectOfflineAgent';

export { LoginDeniedError } from '../entities/loginDenied';

export class LoginUseCase {
  constructor(
    private repository: IAuthRepository = serviceLocator.getAuthRepository(),
    private agents: IAgentRepository = serviceLocator.getAgentRepository()
  ) {}

  async execute(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.repository.login(email, password);
    if (!user) {
      return null;
    }
    await rejectOfflineAgent(user, this.agents, this.repository);
    return user;
  }
}
