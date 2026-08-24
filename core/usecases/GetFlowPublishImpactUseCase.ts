import { FlowStep } from '../entities/Flow';
import { countSessionsOnRemovedSteps } from '../entities/flowPublishImpact';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';

export type FlowPublishImpact = {
  count: number;
};

export class GetFlowPublishImpactUseCase {
  constructor(
    private flows: IFlowRepository,
    private sessions: IFlowSessionRepository
  ) {}

  async execute(flowId: string, nextSteps?: FlowStep[]): Promise<FlowPublishImpact> {
    const id = flowId.trim();
    if (!id) {
      return { count: 0 };
    }
    const flow = await this.flows.getById(id);
    const steps = nextSteps ?? flow?.steps ?? [];
    const sessions = await this.sessions.listByFlowId(id);
    return {
      count: countSessionsOnRemovedSteps(
        sessions,
        steps.map((step) => step.id)
      ),
    };
  }
}
