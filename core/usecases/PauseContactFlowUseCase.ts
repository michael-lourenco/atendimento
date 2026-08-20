import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { resolveActiveFlow } from '../engine/resolveActiveFlow';

export class PauseContactFlowUseCase {
  constructor(
    private sessions: IFlowSessionRepository,
    private flows: IFlowRepository
  ) {}

  async execute(contactId: string): Promise<void> {
    const phone = contactId.trim();
    if (!phone) {
      return;
    }

    const existing = await this.sessions.getByContactId(phone);
    if (existing) {
      await this.sessions.save({
        ...existing,
        paused: true,
        updatedAt: new Date(),
      });
      return;
    }

    const flow = resolveActiveFlow(await this.flows.getAll());
    if (!flow) {
      return;
    }

    await this.sessions.save({
      contactId: phone,
      flowId: flow.id,
      currentStepId: null,
      paused: true,
      updatedAt: new Date(),
    });
  }
}
