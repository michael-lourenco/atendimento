import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class GetAllConversationsUseCase {
  constructor(
    private conversations: IConversationRepository = serviceLocator.getConversationRepository()
  ) {}

  execute(): Promise<Conversation[]> {
    return this.conversations.getAll();
  }
}
