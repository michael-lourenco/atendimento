import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { FlowSession } from '../entities/FlowSession';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class GetFlowSessionUseCase {
  constructor(
    private sessions: IFlowSessionRepository = serviceLocator.getFlowSessionRepository()
  ) {}

  async execute(contactId: string): Promise<FlowSession | null> {
    const phone = contactId.trim();
    if (!phone) {
      return null;
    }
    return this.sessions.getByContactId(phone);
  }
}
