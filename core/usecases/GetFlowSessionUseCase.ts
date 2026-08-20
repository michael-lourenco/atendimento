import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { FlowSession } from '../entities/FlowSession';

export class GetFlowSessionUseCase {
  constructor(
    private sessions: IFlowSessionRepository
  ) {}

  async execute(contactId: string): Promise<FlowSession | null> {
    const phone = contactId.trim();
    if (!phone) {
      return null;
    }
    return this.sessions.getByContactId(phone);
  }
}
