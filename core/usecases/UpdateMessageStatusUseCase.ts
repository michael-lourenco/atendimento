import { Message, MessageStatus } from '../entities/Message';
import { mergeMessageStatus } from '../entities/messageStatus';
import { applyLastMessageStatus } from '../entities/lastMessageForConversation';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class UpdateMessageStatusUseCase {
  constructor(
    private messages: IMessageRepository = serviceLocator.getMessageRepository(),
    private conversations: IConversationRepository | null = null
  ) {}

  async execute(id: string, next: MessageStatus): Promise<Message | null> {
    const existing = await this.messages.getById(id);
    if (!existing) return null;
    const status = mergeMessageStatus(existing.status, next);
    if (status === existing.status) return existing;
    const updated = { ...existing, status };
    await this.messages.save(updated);
    await this.syncConversationPreview(updated);
    return updated;
  }

  private async syncConversationPreview(updated: Message): Promise<void> {
    if (!this.conversations) {
      return;
    }
    const listed = await this.conversations.getAll();
    const hit = listed
      .map((item) => applyLastMessageStatus(item, updated.id, updated.status))
      .find((item) => item != null);
    if (hit) {
      await this.conversations.save(hit);
    }
  }
}
