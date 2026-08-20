import { Flow } from '../entities/Flow';
import { IFlowRepository } from '../repositories/IFlowRepository';

export class GetAllFlowsUseCase {
  constructor(private repository: IFlowRepository) {}

  execute(): Promise<Flow[]> {
    return this.repository.getAll();
  }
}
