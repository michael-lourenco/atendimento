import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { GetAllConversationsUseCase } from './GetAllConversationsUseCase';

class MemoryConversations implements IConversationRepository {
  constructor(private items: Conversation[] = []) {}
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
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

describe('GetAllConversationsUseCase', () => {
  it('lista só o catálogo de conversas', async () => {
    const now = new Date('2026-08-19T12:00:00Z');
    const row: Conversation = {
      id: '5511999999999',
      contactId: '5511999999999',
      contactName: 'Ana',
      contactPhone: '5511999999999',
      status: 'open',
      unreadCount: 0,
      lastActivity: now,
      createdAt: now,
      tags: [],
    };
    const listed = await new GetAllConversationsUseCase(new MemoryConversations([row])).execute();
    expect(listed).toEqual([row]);
  });
});
