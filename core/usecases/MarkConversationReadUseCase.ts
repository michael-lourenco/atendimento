import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class MarkConversationReadUseCase {
  constructor(
    private conversations: IConversationRepository = serviceLocator.getConversationRepository()
  ) {}

  async execute(conversationId: string): Promise<Conversation | null> {
    const id = conversationId.trim();
    if (!id) {
      return null;
    }

    const existing = await this.conversations.getById(id);
    if (!existing) {
      return null;
    }
    if (existing.unreadCount === 0) {
      return existing;
    }

    const updated: Conversation = {
      ...existing,
      unreadCount: 0,
    };
    await this.conversations.save(updated);
    return updated;
  }
}
