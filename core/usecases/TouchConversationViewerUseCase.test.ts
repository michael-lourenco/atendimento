import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { TouchConversationViewerUseCase } from './TouchConversationViewerUseCase';

class MemoryConversations implements IConversationRepository {
  constructor(public items: Conversation[] = []) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async getByDepartment() {
    return [];
  }
  async getByAgent() {
    return [];
  }
  async save(conversation: Conversation) {
    this.items = [...this.items.filter((item) => item.id !== conversation.id), conversation];
  }
  async delete() {}
}

const lastActivity = new Date('2026-08-20T12:00:00Z');

const thread: Conversation = {
  id: 'c1',
  contactId: '5511',
  contactName: 'Ana',
  contactPhone: '5511',
  status: 'open',
  unreadCount: 0,
  lastActivity,
  createdAt: lastActivity,
  tags: [],
};

describe('TouchConversationViewerUseCase', () => {
  it('grava viewer sem mexer em lastActivity', async () => {
    const conversations = new MemoryConversations([thread]);
    const now = new Date('2026-08-20T12:00:10Z');
    const next = await new TouchConversationViewerUseCase(conversations).execute({
      conversationId: 'c1',
      agentId: 'a1',
      agentName: 'João',
      present: true,
      now,
    });
    expect(next?.viewerAgentId).toBe('a1');
    expect(next?.viewerAgentName).toBe('João');
    expect(next?.viewerAt).toEqual(now);
    expect(next?.lastActivity).toEqual(lastActivity);
  });

  it('limpa só se for o próprio', async () => {
    const conversations = new MemoryConversations([
      { ...thread, viewerAgentId: 'a2', viewerAgentName: 'Maria', viewerAt: lastActivity },
    ]);
    const kept = await new TouchConversationViewerUseCase(conversations).execute({
      conversationId: 'c1',
      agentId: 'a1',
      agentName: 'João',
      present: false,
    });
    expect(kept?.viewerAgentId).toBe('a2');
    await new TouchConversationViewerUseCase(conversations).execute({
      conversationId: 'c1',
      agentId: 'a2',
      agentName: 'Maria',
      present: false,
    });
    expect(conversations.items[0].viewerAgentId).toBeUndefined();
  });
});
