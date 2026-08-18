import { InternalMessage } from '../entities/InternalMessage';
import { IInternalMessageRepository } from '../repositories/IInternalMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class GetInternalMessagesUseCase {
  constructor(
    private messages: IInternalMessageRepository = serviceLocator.getInternalMessageRepository()
  ) {}

  execute(conversationId: string): Promise<InternalMessage[]> {
    return this.messages.getByConversation(conversationId);
  }
}
