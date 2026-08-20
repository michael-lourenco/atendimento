import { IFlowRepository } from '../repositories/IFlowRepository';
import { IMediaStorage, StoredMedia, flowStepMediaPath } from '../services/IMediaStorage';

export class GetFlowStepMediaUseCase {
  constructor(
    private flows: IFlowRepository,
    private storage: IMediaStorage
  ) {}

  async execute(flowId: string, stepId: string): Promise<StoredMedia | null> {
    const flow = await this.flows.getById(flowId.trim());
    const step = flow?.steps.find((item) => item.id === stepId.trim());
    if (!flow || step?.type !== 'message') {
      return null;
    }
    return this.storage.get(flowStepMediaPath(flow.id, step.id));
  }
}
