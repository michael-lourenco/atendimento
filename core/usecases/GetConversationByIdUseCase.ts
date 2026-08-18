import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class GetConversationByIdUseCase {
  constructor(
    private conversations: IConversationRepository = serviceLocator.getConversationRepository()
  ) {}

  execute(conversationId: string): Promise<Conversation | null> {
    const id = conversationId.trim();
    if (!id) {
      return Promise.resolve(null);
    }
    return this.conversations.getById(id);
  }
}
