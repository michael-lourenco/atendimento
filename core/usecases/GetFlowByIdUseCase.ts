import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Flow } from '../entities/Flow';

export class GetFlowByIdUseCase {
  async execute(id: string): Promise<Flow | null> {
    const repository = serviceLocator.getFlowRepository();
    return repository.getById(id);
  }
}

