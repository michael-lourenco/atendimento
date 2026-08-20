import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { SetConversationTagsUseCase } from './SetConversationTagsUseCase';

class FakeConversations implements IConversationRepository {
  constructor(private items: Conversation[]) {}
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
    const index = this.items.findIndex((item) => item.id === conversation.id);
    if (index >= 0) {
      this.items[index] = conversation;
    }
  }
  async delete() {}
}

describe('SetConversationTagsUseCase', () => {
  it('grava as etiquetas da thread', async () => {
    const repo = new FakeConversations([
      {
        id: 'c1',
        contactId: '1',
        contactName: 'A',
        contactPhone: '1',
        status: 'open',
        unreadCount: 0,
        lastActivity: new Date(),
        createdAt: new Date(),
        tags: [],
      },
    ]);
    const updated = await new SetConversationTagsUseCase(repo).execute('c1', ['vip', 'vip', '']);
    expect(updated?.tags).toEqual(['vip']);
  });
});
