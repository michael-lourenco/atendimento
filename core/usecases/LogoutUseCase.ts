import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class LogoutUseCase {
  async execute(): Promise<void> {
    const repository = serviceLocator.getAuthRepository();
    return repository.logout();
  }
}

