import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';

export class ResumeContactFlowUseCase {
  constructor(
    private sessions: IFlowSessionRepository
  ) {}

  async execute(contactId: string): Promise<void> {
    const phone = contactId.trim();
    if (!phone) {
      return;
    }

    const existing = await this.sessions.getByContactId(phone);
    if (!existing) {
      return;
    }

    await this.sessions.save({
      ...existing,
      paused: false,
      currentStepId: null,
      updatedAt: new Date(),
    });
  }
}
