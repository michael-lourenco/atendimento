import { FlowSession } from '../entities/FlowSession';

export interface IFlowSessionRepository {
  getByContactId(contactId: string): Promise<FlowSession | null>;
  listByFlowId(flowId: string): Promise<FlowSession[]>;
  save(session: FlowSession): Promise<void>;
  deleteByFlowId(flowId: string): Promise<void>;
}
