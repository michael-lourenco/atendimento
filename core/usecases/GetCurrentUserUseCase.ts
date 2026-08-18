import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { User } from '../entities/User';
import { IAuthRepository } from '../repositories/IAuthRepository';

export class GetCurrentUserUseCase {
  constructor(private repository: IAuthRepository = serviceLocator.getAuthRepository()) {}

  execute(): Promise<User | null> {
    return this.repository.getCurrentUser();
  }
}
