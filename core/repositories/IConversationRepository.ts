import { Conversation } from '../entities/Conversation';

export interface IConversationRepository {
  getAll(): Promise<Conversation[]>;
  getById(id: string): Promise<Conversation | null>;
  getByDepartment(departmentId: string): Promise<Conversation[]>;
  getByAgent(agentId: string): Promise<Conversation[]>;
  save(conversation: Conversation): Promise<void>;
  delete(id: string): Promise<void>;
}
