import { isAdmin } from '../entities/operatorRole';
import { User } from '../entities/User';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { CreateOperatorInput, IAuthRepository } from '../repositories/IAuthRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { EnsureOperatorAgentUseCase } from './EnsureOperatorAgentUseCase';

export class CreateOperatorError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export type CreateOperatorRequest = CreateOperatorInput;

export class CreateOperatorUseCase {
  constructor(
    private auth: IAuthRepository = serviceLocator.getAuthRepository(),
    private agents: IAgentRepository = serviceLocator.getAgentRepository(),
    private ensure: EnsureOperatorAgentUseCase = new EnsureOperatorAgentUseCase()
  ) {}

  async execute(actor: User, input: CreateOperatorRequest): Promise<User> {
    if (!isAdmin(actor)) {
      throw new CreateOperatorError('Só o admin cadastra atendentes', 403);
    }
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!email || !name) {
      throw new CreateOperatorError('Nome e e-mail obrigatórios', 400);
    }
    if (input.password.length < 6) {
      throw new CreateOperatorError('Senha mínima de 6 caracteres', 400);
    }
    const created = await this.auth.createOperator({
      email,
      password: input.password,
      name,
      role: input.role === 'admin' ? 'admin' : 'user',
      departmentId: input.departmentId,
    });
    if (!created) {
      throw new CreateOperatorError('Não foi possível criar o atendente', 409);
    }
    const agent = await this.ensure.execute(created);
    if (input.departmentId) {
      await this.agents.save({ ...agent, departmentId: input.departmentId });
    }
    return created;
  }
}
