import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export interface SetConversationDepartmentInput {
  conversationId: string;
  departmentId: string;
  departmentName: string;
}

export class SetConversationDepartmentUseCase {
  constructor(
    private conversations: IConversationRepository = serviceLocator.getConversationRepository()
  ) {}

  async execute(input: SetConversationDepartmentInput): Promise<Conversation | null> {
    const conversationId = input.conversationId.trim();
    if (!conversationId) {
      return null;
    }

    const existing = await this.conversations.getById(conversationId);
    if (!existing) {
      return null;
    }

    const departmentId = input.departmentId.trim();
    const departmentName = input.departmentName.trim();
    const updated: Conversation = {
      ...existing,
      departmentId: departmentId || undefined,
      departmentName: departmentId ? departmentName : undefined,
      lastActivity: new Date(),
    };

    await this.conversations.save(updated);
    return updated;
  }
}
