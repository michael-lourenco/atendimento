import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';

export class ReopenConversationUseCase {
  constructor(private conversations: IConversationRepository) {}

  async execute(conversationId: string): Promise<Conversation | null> {
    const id = conversationId.trim();
    if (!id) {
      return null;
    }
    const existing = await this.conversations.getById(id);
    if (!existing) {
      return null;
    }
    const updated: Conversation = {
      ...existing,
      status: 'open',
      assignedAgentId: undefined,
      assignedAgentName: undefined,
      assignedAt: undefined,
      lastActivity: new Date(),
    };
    await this.conversations.save(updated);
    return updated;
  }
}
