import { Agent } from '../entities/Agent';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';

export class AgentCatalogUseCase extends CatalogUseCase<Agent> {
  constructor(repo: IAgentRepository = serviceLocator.getAgentRepository()) {
    super(repo);
  }
}
