import { InternalMessage } from '../entities/InternalMessage';

export interface IInternalMessageRepository {
  getByConversation(conversationId: string): Promise<InternalMessage[]>;
  save(message: InternalMessage): Promise<void>;
}
