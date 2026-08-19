import { isAdmin } from '../entities/operatorRole';
import { User } from '../entities/User';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CreateOperatorError } from './CreateOperatorUseCase';

export class SetOperatorPasswordUseCase {
  constructor(private auth: IAuthRepository = serviceLocator.getAuthRepository()) {}

  async execute(actor: User, targetId: string, password: string): Promise<void> {
    if (!isAdmin(actor)) {
      throw new CreateOperatorError('Só o admin redefine senha', 403);
    }
    if (password.length < 6) {
      throw new CreateOperatorError('Senha mínima de 6 caracteres', 400);
    }
    const operators = await this.auth.listOperators();
    if (!operators.some((item) => item.id === targetId)) {
      throw new CreateOperatorError('Operador não encontrado', 404);
    }
    const ok = await this.auth.setOperatorPassword(targetId, password);
    if (!ok) {
      throw new CreateOperatorError('Não foi possível redefinir a senha', 500);
    }
  }
}
