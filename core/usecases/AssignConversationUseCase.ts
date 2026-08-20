import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';

export interface AssignConversationInput {
  conversationId: string;
  agentId: string;
  agentName: string;
  departmentId?: string;
  departmentName?: string;
}

export class AssignConversationUseCase {
  constructor(
    private conversations: IConversationRepository
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
    const departmentId = existing?.departmentId ?? input.departmentId?.trim();
    const departmentName = existing?.departmentName ?? input.departmentName?.trim();
    const assignedAt = existing?.assignedAt ?? now;
    const updated: Conversation = existing
      ? {
          ...existing,
          assignedAgentId: agentId,
          assignedAgentName: agentName,
          assignedAt,
          departmentId,
          departmentName,
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
          assignedAt,
          departmentId,
          departmentName,
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
