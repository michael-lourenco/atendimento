import { IAuthRepository } from '../repositories/IAuthRepository';

export class LogoutUseCase {
  constructor(private repository: IAuthRepository) {}

  execute(): Promise<void> {
    return this.repository.logout();
  }
}
