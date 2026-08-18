import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { AuthUser } from '../entities/User';
import { IAuthRepository } from '../repositories/IAuthRepository';

export class LoginUseCase {
  constructor(private repository: IAuthRepository = serviceLocator.getAuthRepository()) {}

  execute(email: string, password: string): Promise<AuthUser | null> {
    return this.repository.login(email, password);
  }
}
