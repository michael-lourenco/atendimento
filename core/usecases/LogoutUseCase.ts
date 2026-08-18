import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { IAuthRepository } from '../repositories/IAuthRepository';

export class LogoutUseCase {
  constructor(private repository: IAuthRepository = serviceLocator.getAuthRepository()) {}

  execute(): Promise<void> {
    return this.repository.logout();
  }
}
