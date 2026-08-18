import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { UpsertConversationFromMessageUseCase } from './UpsertConversationFromMessageUseCase';

export class GetAllConversationsUseCase {
  constructor(
    private conversations: IConversationRepository = serviceLocator.getConversationRepository(),
    private messages: IMessageRepository = serviceLocator.getMessageRepository(),
    private upsertConversation: UpsertConversationFromMessageUseCase = new UpsertConversationFromMessageUseCase()
  ) {}

  async execute(): Promise<Conversation[]> {
    const allMessages = await this.messages.getAll();
    await this.upsertConversation.ensureFromMessages(allMessages);
    return this.conversations.getAll();
  }
}
