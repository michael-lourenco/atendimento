import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { AuthUser } from '../entities/User';
import { findAgentByEmail } from '../entities/uniqueAgentEmail';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';

export class LoginDeniedError extends Error {
  constructor(message = 'Este atendente está desativado') {
    super(message);
    this.name = 'LoginDeniedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

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
    const list = await this.agents.getAll();
    const agent =
      list.find((item) => item.id === user.id) ?? findAgentByEmail(list, user.email);
    if (agent?.status === 'offline') {
      await this.repository.logout();
      throw new LoginDeniedError();
    }
    return user;
  }
}
