import { Flow } from '../entities/Flow';
import { IFlowRepository } from '../repositories/IFlowRepository';

export class GetFlowByIdUseCase {
  constructor(private repository: IFlowRepository) {}

  execute(id: string): Promise<Flow | null> {
    return this.repository.getById(id);
  }
}
