import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { MarkConversationReadUseCase } from './MarkConversationReadUseCase';

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
    this.items = this.items.map((item) => (item.id === conversation.id ? conversation : item));
  }
  async delete() {}
}

describe('MarkConversationReadUseCase', () => {
  const now = new Date('2026-08-18T15:00:00Z');

  it('zera não lidas sem mudar lastActivity', async () => {
    const repo = new FakeConversations([
      {
        id: '5521982790723',
        contactId: '5521982790723',
        contactName: 'Cliente',
        contactPhone: '5521982790723',
        status: 'open',
        unreadCount: 4,
        lastActivity: now,
        createdAt: now,
        tags: [],
      },
    ]);

    const updated = await new MarkConversationReadUseCase(repo).execute('5521982790723');
    expect(updated?.unreadCount).toBe(0);
    expect(updated?.lastActivity).toBe(now);
    expect(updated?.status).toBe('open');
  });

  it('não grava de novo se já está zerado', async () => {
    const repo = new FakeConversations([
      {
        id: '5521',
        contactId: '5521',
        contactName: 'A',
        contactPhone: '5521',
        status: 'open',
        unreadCount: 0,
        lastActivity: now,
        createdAt: now,
        tags: [],
      },
    ]);
    const before = repo.items[0];
    const updated = await new MarkConversationReadUseCase(repo).execute('5521');
    expect(updated).toBe(before);
  });

  it('retorna null se a conversa não existe', async () => {
    const updated = await new MarkConversationReadUseCase(new FakeConversations([])).execute('x');
    expect(updated).toBeNull();
  });
});
