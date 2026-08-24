import { Flow } from '../entities/Flow';
import { entryFlowIsHealthy, flowHealthIssues } from '../engine/flowHealth';
import { IFlowRepository } from '../repositories/IFlowRepository';

export function assertHealthyEntryFlow(flowId: string | undefined, catalog: Flow[]): void {
  const id = flowId?.trim();
  if (!id) {
    return;
  }
  const flow = catalog.find((item) => item.id === id) ?? null;
  if (!flow || !entryFlowIsHealthy(flow, catalog)) {
    throw Object.assign(
      new Error('Este fluxo tem problemas. Corrija e publique antes de usar na entrada.'),
      { status: 400 }
    );
  }
}

export class PublishFlowUseCase {
  constructor(private flows: IFlowRepository) {}

  async execute(flowId: string): Promise<Flow | null> {
    const flow = await this.flows.getById(flowId);
    if (!flow) {
      return null;
    }
    const catalog = await this.flows.getAll();
    if (flowHealthIssues(flow.steps, catalog).length > 0) {
      throw Object.assign(new Error('Corrija os problemas do roteiro antes de publicar'), {
        status: 400,
      });
    }
    const published: Flow = {
      ...flow,
      publishedSteps: flow.steps,
      updatedAt: new Date(),
    };
    await this.flows.save(published);
    return published;
  }
}
