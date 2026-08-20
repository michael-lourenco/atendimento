import { AuthUser } from '../entities/User';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { rejectOfflineAgent } from './rejectOfflineAgent';

export { LoginDeniedError } from '../entities/loginDenied';

export class LoginUseCase {
  constructor(
    private repository: IAuthRepository,
    private agents: IAgentRepository
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
