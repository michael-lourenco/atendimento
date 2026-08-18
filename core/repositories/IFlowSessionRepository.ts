import { FlowSession } from '../entities/FlowSession';

export interface IFlowSessionRepository {
  getByContactId(contactId: string): Promise<FlowSession | null>;
  save(session: FlowSession): Promise<void>;
}
