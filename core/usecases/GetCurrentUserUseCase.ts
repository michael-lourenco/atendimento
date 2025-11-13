import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { User } from '../entities/User';

export class GetCurrentUserUseCase {
  async execute(): Promise<User | null> {
    const repository = serviceLocator.getAuthRepository();
    return repository.getCurrentUser();
  }
}

