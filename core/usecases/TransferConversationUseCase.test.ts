import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { TransferConversationUseCase } from './TransferConversationUseCase';

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

describe('TransferConversationUseCase', () => {
  it('atribui agente e marca transferred', async () => {
    const now = new Date('2026-08-18T15:00:00Z');
    const repo = new FakeConversations([
      {
        id: 'c1',
        contactId: '1',
        contactName: 'João',
        contactPhone: '5511',
        status: 'open',
        unreadCount: 0,
        lastActivity: now,
        createdAt: now,
        tags: [],
      },
    ]);

    const updated = await new TransferConversationUseCase(repo).execute({
      conversationId: 'c1',
      targetAgentId: '2',
      targetAgentName: 'Carlos Santos',
    });

    expect(updated?.status).toBe('transferred');
    expect(updated?.assignedAgentId).toBe('2');
    expect(updated?.assignedAgentName).toBe('Carlos Santos');
  });

  it('herda o setor do agente destino', async () => {
    const now = new Date('2026-08-18T15:00:00Z');
    const repo = new FakeConversations([
      {
        id: 'c1',
        contactId: '1',
        contactName: 'João',
        contactPhone: '5511',
        departmentId: '1',
        departmentName: 'Vendas',
        status: 'open',
        unreadCount: 0,
        lastActivity: now,
        createdAt: now,
        tags: [],
      },
    ]);

    const updated = await new TransferConversationUseCase(repo).execute({
      conversationId: 'c1',
      targetAgentId: '2',
      targetAgentName: 'Carlos Santos',
      departmentId: '2',
      departmentName: 'Suporte',
    });

    expect(updated?.departmentId).toBe('2');
    expect(updated?.departmentName).toBe('Suporte');
  });

  it('retorna null se a conversa não existe', async () => {
    const result = await new TransferConversationUseCase(new FakeConversations([])).execute({
      conversationId: 'missing',
      targetAgentId: '2',
      targetAgentName: 'Carlos Santos',
    });
    expect(result).toBeNull();
  });
});
