import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';

export interface TransferConversationInput {
  conversationId: string;
  targetAgentId: string;
  targetAgentName: string;
  departmentId?: string;
  departmentName?: string;
}

export class TransferConversationUseCase {
  constructor(
    private conversations: IConversationRepository
  ) {}

  async execute(input: TransferConversationInput): Promise<Conversation | null> {
    const conversation = await this.conversations.getById(input.conversationId);
    if (!conversation) {
      return null;
    }

    const departmentId = input.departmentId?.trim() || conversation.departmentId;
    const departmentName = input.departmentName?.trim() || conversation.departmentName;
    const updated: Conversation = {
      ...conversation,
      assignedAgentId: input.targetAgentId,
      assignedAgentName: input.targetAgentName,
      departmentId,
      departmentName,
      status: 'transferred',
      lastActivity: new Date(),
    };

    await this.conversations.save(updated);
    return updated;
  }
}
