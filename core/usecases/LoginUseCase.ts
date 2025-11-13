import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { AuthUser } from '../entities/User';

export class LoginUseCase {
  async execute(email: string, password: string): Promise<AuthUser | null> {
    const repository = serviceLocator.getAuthRepository();
    return repository.login(email, password);
  }
}

