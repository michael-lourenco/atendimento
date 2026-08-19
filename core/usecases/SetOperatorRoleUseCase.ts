import { canChangeOperatorRole, isAdmin } from '../entities/operatorRole';
import { User } from '../entities/User';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CreateOperatorError } from './CreateOperatorUseCase';

export class SetOperatorRoleUseCase {
  constructor(private auth: IAuthRepository = serviceLocator.getAuthRepository()) {}

  async execute(actor: User, targetId: string, role: 'admin' | 'user'): Promise<void> {
    if (!isAdmin(actor)) {
      throw new CreateOperatorError('Só o admin altera papéis', 403);
    }
    const operators = await this.auth.listOperators();
    if (!canChangeOperatorRole(actor, operators, targetId, role)) {
      throw new CreateOperatorError('Não é possível rebaixar o último admin', 400);
    }
    const ok = await this.auth.setOperatorRole(targetId, role);
    if (!ok) {
      throw new CreateOperatorError('Operador não encontrado', 404);
    }
  }
}
