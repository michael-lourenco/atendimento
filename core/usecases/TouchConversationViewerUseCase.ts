import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';

export class TouchConversationViewerUseCase {
  constructor(private conversations: IConversationRepository) {}

  async execute(input: {
    conversationId: string;
    agentId: string;
    agentName: string;
    present: boolean;
    now?: Date;
  }): Promise<Conversation | null> {
    const conversationId = input.conversationId.trim();
    const agentId = input.agentId.trim();
    const agentName = input.agentName.trim();
    if (!conversationId || !agentId || !agentName) {
      return null;
    }
    const existing = await this.conversations.getById(conversationId);
    if (!existing) {
      return null;
    }
    const now = input.now ?? new Date();
    const next: Conversation = input.present
      ? {
          ...existing,
          viewerAgentId: agentId,
          viewerAgentName: agentName,
          viewerAt: now,
        }
      : existing.viewerAgentId === agentId
        ? {
            ...existing,
            viewerAgentId: undefined,
            viewerAgentName: undefined,
            viewerAt: undefined,
          }
        : existing;
    if (next === existing) {
      return existing;
    }
    await this.conversations.save(next);
    return next;
  }
}
