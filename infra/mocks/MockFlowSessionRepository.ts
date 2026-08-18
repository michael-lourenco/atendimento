import { IFlowSessionRepository } from '../../core/repositories/IFlowSessionRepository';
import { FlowSession } from '../../core/entities/FlowSession';

export class MockFlowSessionRepository implements IFlowSessionRepository {
  private sessions = new Map<string, FlowSession>();

  async getByContactId(contactId: string): Promise<FlowSession | null> {
    return this.sessions.get(contactId) ?? null;
  }

  async save(session: FlowSession): Promise<void> {
    this.sessions.set(session.contactId, { ...session });
  }
}

export const mockFlowSessionRepository = new MockFlowSessionRepository();
