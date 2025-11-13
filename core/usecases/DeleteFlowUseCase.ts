import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class DeleteFlowUseCase {
  async execute(id: string): Promise<void> {
    const repository = serviceLocator.getFlowRepository();
    return repository.delete(id);
  }
}

