import { Conversation } from '../entities/Conversation';
import { ApplyContactTypingUseCase } from './ApplyContactTypingUseCase';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';

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

class MemoryNumbers implements IWhatsAppNumberRepository {
  constructor(private items: WhatsAppNumber[] = []) {}
  async getAll() {
    return this.items;
  }
  async getById() {
    return null;
  }
  async save() {}
  async delete() {}
}

describe('ApplyContactTypingUseCase', () => {
  const thread: Conversation = {
    id: '5511',
    contactId: '5511',
    contactName: 'Ana',
    contactPhone: '5511',
    status: 'open',
    unreadCount: 0,
    lastActivity: new Date('2026-08-20T12:00:00Z'),
    createdAt: new Date('2026-08-20T12:00:00Z'),
    tags: [],
  };

  it('grava contactTypingAt ao compor', async () => {
    const conversations = new MemoryConversations([thread]);
    await new ApplyContactTypingUseCase(conversations, new MemoryNumbers()).execute({
      phone: '5511',
      instanceName: 'default',
      composing: true,
    });
    expect(conversations.items[0].contactTypingAt).toBeInstanceOf(Date);
  });

  it('paused zera', async () => {
    const conversations = new MemoryConversations([
      { ...thread, contactTypingAt: new Date('2026-08-20T12:00:00Z') },
    ]);
    await new ApplyContactTypingUseCase(conversations, new MemoryNumbers()).execute({
      phone: '5511',
      instanceName: 'default',
      composing: false,
    });
    expect(conversations.items[0].contactTypingAt).toBeUndefined();
  });
});
