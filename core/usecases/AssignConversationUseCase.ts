import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export interface AssignConversationInput {
  conversationId: string;
  agentId: string;
  agentName: string;
}

export class AssignConversationUseCase {
  constructor(
    private conversations: IConversationRepository = serviceLocator.getConversationRepository()
  ) {}

  async execute(input: AssignConversationInput): Promise<Conversation | null> {
    const conversationId = input.conversationId.trim();
    const agentId = input.agentId.trim();
    const agentName = input.agentName.trim();
    if (!conversationId || !agentId || !agentName) {
      return null;
    }

    const existing = await this.conversations.getById(conversationId);
    const now = new Date();
    const updated: Conversation = existing
      ? {
          ...existing,
          assignedAgentId: agentId,
          assignedAgentName: agentName,
          status: 'waiting',
          lastActivity: now,
        }
      : {
          id: conversationId,
          contactId: conversationId,
          contactName: conversationId,
          contactPhone: conversationId,
          assignedAgentId: agentId,
          assignedAgentName: agentName,
          status: 'waiting',
          unreadCount: 0,
          lastActivity: now,
          createdAt: now,
          tags: [],
        };

    await this.conversations.save(updated);
    return updated;
  }
}
