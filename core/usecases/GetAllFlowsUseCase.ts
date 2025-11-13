import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Flow } from '../entities/Flow';

export class GetAllFlowsUseCase {
  async execute(): Promise<Flow[]> {
    const repository = serviceLocator.getFlowRepository();
    return repository.getAll();
  }
}

