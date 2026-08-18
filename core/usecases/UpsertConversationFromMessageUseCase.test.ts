import { Message } from '../entities/Message';
import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { UpsertConversationFromMessageUseCase } from './UpsertConversationFromMessageUseCase';

class MemoryConversations implements IConversationRepository {
  items: Conversation[] = [];
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
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

const incoming: Message = {
  id: 'm1',
  from: '5511999999999',
  to: 'bot',
  content: 'oi',
  type: 'text',
  timestamp: new Date('2026-08-18T18:00:00Z'),
  direction: 'incoming',
  status: 'delivered',
};

describe('UpsertConversationFromMessageUseCase', () => {
  it('cria conversa open na primeira incoming', async () => {
    const repo = new MemoryConversations();
    const conversation = await new UpsertConversationFromMessageUseCase(repo).execute(incoming);
    expect(conversation?.id).toBe('5511999999999');
    expect(conversation?.status).toBe('open');
    expect(conversation?.unreadCount).toBe(1);
    expect(repo.items).toHaveLength(1);
  });

  it('reabre conversa fechada e incrementa não lidas', async () => {
    const repo = new MemoryConversations();
    const useCase = new UpsertConversationFromMessageUseCase(repo);
    await useCase.execute(incoming);
    await repo.save({ ...repo.items[0], status: 'closed', unreadCount: 0 });
    const again = await useCase.execute({ ...incoming, id: 'm2' });
    expect(again?.status).toBe('open');
    expect(again?.unreadCount).toBe(1);
  });

  it('ensureFromMessages cria só o que falta, sem inflar não lidas', async () => {
    const repo = new MemoryConversations();
    const useCase = new UpsertConversationFromMessageUseCase(repo);
    await useCase.ensureFromMessages([
      incoming,
      { ...incoming, id: 'm2', content: 'de novo' },
    ]);
    expect(repo.items).toHaveLength(1);
    expect(repo.items[0].unreadCount).toBe(2);
    await useCase.ensureFromMessages([incoming]);
    expect(repo.items[0].unreadCount).toBe(2);
  });

  it('usa o nome do WhatsApp na conversa', async () => {
    const repo = new MemoryConversations();
    const conversation = await new UpsertConversationFromMessageUseCase(repo).execute({
      ...incoming,
      contactName: 'Ana Lima',
    });
    expect(conversation?.contactName).toBe('Ana Lima');
  });
});
