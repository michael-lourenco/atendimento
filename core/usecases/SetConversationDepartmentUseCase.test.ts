import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { SetConversationDepartmentUseCase } from './SetConversationDepartmentUseCase';

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
    } else {
      this.items.push(conversation);
    }
  }
  async delete() {}
}

const now = new Date('2026-08-18T15:00:00Z');

function openConversation(): Conversation {
  return {
    id: '5521982790723',
    contactId: '5521982790723',
    contactName: 'Cliente',
    contactPhone: '5521982790723',
    status: 'open',
    unreadCount: 1,
    lastActivity: now,
    createdAt: now,
    tags: [],
  };
}

describe('SetConversationDepartmentUseCase', () => {
  it('grava setor', async () => {
    const repo = new FakeConversations([openConversation()]);
    const updated = await new SetConversationDepartmentUseCase(repo).execute({
      conversationId: '5521982790723',
      departmentId: '1',
      departmentName: 'Vendas',
    });
    expect(updated?.departmentId).toBe('1');
    expect(updated?.departmentName).toBe('Vendas');
  });

  it('id vazio remove o setor', async () => {
    const repo = new FakeConversations([
      { ...openConversation(), departmentId: '1', departmentName: 'Vendas' },
    ]);
    const updated = await new SetConversationDepartmentUseCase(repo).execute({
      conversationId: '5521982790723',
      departmentId: '',
      departmentName: 'Vendas',
    });
    expect(updated?.departmentId).toBeUndefined();
    expect(updated?.departmentName).toBeUndefined();
  });

  it('retorna null se a conversa não existe', async () => {
    const updated = await new SetConversationDepartmentUseCase(new FakeConversations([])).execute({
      conversationId: 'x',
      departmentId: '1',
      departmentName: 'Vendas',
    });
    expect(updated).toBeNull();
  });
});
