import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Flow } from '../entities/Flow';

export class SaveFlowUseCase {
  async execute(flow: Flow): Promise<void> {
    const repository = serviceLocator.getFlowRepository();
    return repository.save(flow);
  }
}

