import { InternalMessage } from '../entities/InternalMessage';
import { IInternalMessageRepository } from '../repositories/IInternalMessageRepository';

export class GetInternalMessagesUseCase {
  constructor(
    private messages: IInternalMessageRepository
  ) {}

  execute(conversationId: string): Promise<InternalMessage[]> {
    return this.messages.getByConversation(conversationId);
  }
}
