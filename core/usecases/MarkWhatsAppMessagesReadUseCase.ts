import { outgoingWhatsAppLine } from '../entities/whatsappNumberLine';
import { messagesForConversation } from '../entities/lastMessageForConversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { IWhatsAppService } from '../services/IWhatsAppService';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { UpdateMessageStatusUseCase } from './UpdateMessageStatusUseCase';

export class MarkWhatsAppMessagesReadUseCase {
  constructor(
    private whatsApp: IWhatsAppService = serviceLocator.getWhatsAppService(),
    private conversations: IConversationRepository = serviceLocator.getConversationRepository(),
    private messages: IMessageRepository = serviceLocator.getMessageRepository(),
    private numbers: IWhatsAppNumberRepository = serviceLocator.getWhatsAppNumberRepository(),
    private updateStatus: UpdateMessageStatusUseCase = new UpdateMessageStatusUseCase(messages)
  ) {}

  async execute(conversationId: string): Promise<{ marked: number } | null> {
    const id = conversationId.trim();
    if (!id) {
      return null;
    }
    const conversation = await this.conversations.getById(id);
    if (!conversation) {
      return null;
    }
    const catalog = await this.numbers.getAll();
    const line = catalog.find((item) => item.id === conversation.whatsappNumberId);
    const thread = messagesForConversation(
      await this.messages.getByContact(conversation.contactPhone),
      conversation,
      line
    );
    const unread = thread.filter(
      (item) => item.direction === 'incoming' && item.status !== 'read'
    );
    if (unread.length === 0) {
      return { marked: 0 };
    }
    const instanceName = outgoingWhatsAppLine(conversation, catalog).instanceName;
    if (this.whatsApp.markMessagesRead) {
      try {
        await this.whatsApp.markMessagesRead({
          to: conversation.contactPhone,
          messageIds: unread.map((item) => item.id),
          instanceName,
        });
      } catch {
        return { marked: 0 };
      }
    }
    for (const item of unread) {
      await this.updateStatus.execute(item.id, 'read');
    }
    return { marked: unread.length };
  }
}
