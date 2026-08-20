import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { attachMissingLastMessages } from '../entities/lastMessageForConversation';

export class GetAllConversationsUseCase {
  constructor(
    private conversations: IConversationRepository = serviceLocator.getConversationRepository(),
    private messages: IMessageRepository = serviceLocator.getMessageRepository(),
    private numbers: IWhatsAppNumberRepository = serviceLocator.getWhatsAppNumberRepository()
  ) {}

  async execute(persistPreview = false): Promise<Conversation[]> {
    const listed = await this.conversations.getAll();
    if (listed.every((item) => item.lastMessage)) {
      return listed;
    }
    const [messageList, numberList] = await Promise.all([
      this.messages.getAll(),
      this.numbers.getAll(),
    ]);
    const hydrated = attachMissingLastMessages(listed, messageList, numberList);
    if (persistPreview) {
      await Promise.allSettled(
        hydrated
          .filter((item, index) => item.lastMessage && !listed[index].lastMessage)
          .map((item) => this.conversations.save(item))
      );
    }
    return hydrated;
  }
}
