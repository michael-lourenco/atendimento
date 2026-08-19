import { Agent } from '../entities/Agent';
import { agentEmailTaken } from '../entities/uniqueAgentEmail';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';
import { CreateOperatorError } from './CreateOperatorUseCase';

export class AgentCatalogUseCase extends CatalogUseCase<Agent> {
  constructor(repo: IAgentRepository = serviceLocator.getAgentRepository()) {
    super(repo);
  }

  async save(entity: Agent): Promise<void> {
    if (agentEmailTaken(await this.list(), entity.email, entity.id)) {
      throw new CreateOperatorError('Este e-mail já está cadastrado', 409);
    }
    return super.save(entity);
  }
}
