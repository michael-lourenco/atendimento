import { findAgentByEmail } from '../entities/uniqueAgentEmail';
import { canDeleteOperator, isAdmin } from '../entities/operatorRole';
import { User } from '../entities/User';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CreateOperatorError } from './CreateOperatorUseCase';

export class DeleteOperatorUseCase {
  constructor(
    private auth: IAuthRepository = serviceLocator.getAuthRepository(),
    private agents: IAgentRepository = serviceLocator.getAgentRepository()
  ) {}

  async execute(actor: User, targetId: string): Promise<void> {
    if (!isAdmin(actor)) {
      throw new CreateOperatorError('Só o admin exclui atendentes', 403);
    }
    const operators = await this.auth.listOperators();
    if (!canDeleteOperator(actor, operators, targetId)) {
      throw new CreateOperatorError('Não é possível excluir o último admin', 400);
    }
    const target = operators.find((item) => item.id === targetId);
    if (!target) {
      throw new CreateOperatorError('Operador não encontrado', 404);
    }
    const ok = await this.auth.deleteOperator(target.id);
    if (!ok) {
      throw new CreateOperatorError('Não foi possível excluir o atendente', 500);
    }
    const catalog = await this.agents.getAll();
    const leftover = new Set(
      [catalog.find((item) => item.id === target.id), findAgentByEmail(catalog, target.email)]
        .filter(Boolean)
        .map((item) => item!.id)
    );
    for (const id of leftover) {
      await this.agents.delete(id);
    }
  }
}
