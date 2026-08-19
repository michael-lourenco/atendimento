import { isAdmin } from '../entities/operatorRole';
import { User } from '../entities/User';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CreateOperatorError } from './CreateOperatorUseCase';

export class ListOperatorsUseCase {
  constructor(private auth: IAuthRepository = serviceLocator.getAuthRepository()) {}

  async execute(actor: User): Promise<User[]> {
    if (!isAdmin(actor)) {
      throw new CreateOperatorError('Só o admin lista operadores', 403);
    }
    return this.auth.listOperators();
  }
}
