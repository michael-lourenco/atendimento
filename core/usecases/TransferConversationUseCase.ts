import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export interface TransferConversationInput {
  conversationId: string;
  targetAgentId: string;
  targetAgentName: string;
}

export class TransferConversationUseCase {
  constructor(
    private conversations: IConversationRepository = serviceLocator.getConversationRepository()
  ) {}

  async execute(input: TransferConversationInput): Promise<Conversation | null> {
    const conversation = await this.conversations.getById(input.conversationId);
    if (!conversation) {
      return null;
    }

    const updated: Conversation = {
      ...conversation,
      assignedAgentId: input.targetAgentId,
      assignedAgentName: input.targetAgentName,
      status: 'transferred',
      lastActivity: new Date(),
    };

    await this.conversations.save(updated);
    return updated;
  }
}
