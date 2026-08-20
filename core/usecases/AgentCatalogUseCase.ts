import { Agent } from '../entities/Agent';
import { canSetAgentOffline } from '../entities/agentStatus';
import { agentEmailTaken } from '../entities/uniqueAgentEmail';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { CatalogUseCase } from './CatalogUseCase';
import { CreateOperatorError } from './CreateOperatorUseCase';

export class AgentCatalogUseCase extends CatalogUseCase<Agent> {
  constructor(
    repo: IAgentRepository,
    private auth: IAuthRepository
  ) {
    super(repo);
  }

  async save(entity: Agent): Promise<void> {
    if (agentEmailTaken(await this.list(), entity.email, entity.id)) {
      throw new CreateOperatorError('Este e-mail já está cadastrado', 409);
    }
    const previous = await this.getById(entity.id);
    if (entity.status === 'offline' && previous?.status !== 'offline') {
      const actor = await this.auth.getCurrentUser();
      const operators = actor ? await this.auth.listOperators() : [];
      const agents = (await this.list()).map((item) => (item.id === entity.id ? entity : item));
      if (!agents.some((item) => item.id === entity.id)) {
        agents.push(entity);
      }
      if (!canSetAgentOffline(actor, entity, agents, operators)) {
        throw new CreateOperatorError('Não é possível desativar este atendente', 403);
      }
    }
    return super.save(entity);
  }
}
