import { Flow } from '../entities/Flow';
import { IFlowRepository } from '../repositories/IFlowRepository';

export class SaveFlowUseCase {
  constructor(private repository: IFlowRepository) {}

  execute(flow: Flow): Promise<void> {
    return this.repository.save(flow);
  }
}
