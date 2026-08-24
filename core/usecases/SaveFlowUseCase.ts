import { Flow } from '../entities/Flow';
import { IFlowRepository } from '../repositories/IFlowRepository';

export class SaveFlowUseCase {
  constructor(private repository: IFlowRepository) {}

  async execute(flow: Flow): Promise<Flow> {
    const existing = await this.repository.getById(flow.id);
    const publishedSteps = flow.publishedSteps?.length
      ? flow.publishedSteps
      : existing?.publishedSteps?.length
        ? existing.publishedSteps
        : flow.steps;
    const next = { ...flow, publishedSteps };
    await this.repository.save(next);
    return next;
  }
}
