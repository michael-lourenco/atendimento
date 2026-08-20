import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';

export class SetConversationTagsUseCase {
  constructor(
    private conversations: IConversationRepository
  ) {}

  async execute(conversationId: string, tags: string[]): Promise<Conversation | null> {
    const id = conversationId.trim();
    if (!id) {
      return null;
    }
    const existing = await this.conversations.getById(id);
    if (!existing) {
      return null;
    }
    const next: Conversation = {
      ...existing,
      tags: [...new Set(tags.map((item) => item.trim()).filter(Boolean))],
      lastActivity: new Date(),
    };
    await this.conversations.save(next);
    return next;
  }
}
