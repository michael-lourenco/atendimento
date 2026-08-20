import { Conversation } from '../entities/Conversation';
import { Message } from '../entities/Message';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { GetAllConversationsUseCase } from './GetAllConversationsUseCase';

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
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

class MemoryMessages implements IMessageRepository {
  constructor(private items: Message[] = []) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async getByContact() {
    return [];
  }
  async save() {
    return;
  }
  async delete() {
    return;
  }
}

class MemoryNumbers implements IWhatsAppNumberRepository {
  constructor(private items: WhatsAppNumber[] = []) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save() {
    return;
  }
  async delete() {
    return;
  }
}

const now = new Date('2026-08-19T12:00:00Z');

const row = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: '5515996507651',
  contactId: '5515996507651',
  contactName: 'Ana',
  contactPhone: '5515996507651',
  status: 'open',
  unreadCount: 0,
  lastActivity: now,
  createdAt: now,
  tags: [],
  ...overrides,
});

const last: Message = {
  id: 'm-last',
  from: '5515996507651',
  to: 'comercial',
  content: 'preciso de ajuda',
  type: 'text',
  timestamp: now,
  direction: 'incoming',
  status: 'delivered',
};

describe('GetAllConversationsUseCase', () => {
  it('lista só o catálogo quando já tem prévia', async () => {
    const conversations = new MemoryConversations([row({ lastMessage: last })]);
    const messages = new MemoryMessages([last]);
    let messageReads = 0;
    const originalGetAll = messages.getAll.bind(messages);
    messages.getAll = async () => {
      messageReads += 1;
      return originalGetAll();
    };
    const listed = await new GetAllConversationsUseCase(
      conversations,
      messages,
      new MemoryNumbers()
    ).execute();
    expect(listed[0].lastMessage?.content).toBe('preciso de ajuda');
    expect(messageReads).toBe(0);
  });

  it('preenche e grava a prévia quando o snapshot falta', async () => {
    const conversations = new MemoryConversations([row()]);
    const listed = await new GetAllConversationsUseCase(
      conversations,
      new MemoryMessages([last]),
      new MemoryNumbers()
    ).execute();
    expect(listed[0].lastMessage?.content).toBe('preciso de ajuda');
    expect(conversations.items[0].lastMessage?.content).toBe('preciso de ajuda');
  });

  it('mesmo se gravar o snapshot falhar, devolve a prévia', async () => {
    const conversations = new MemoryConversations([row()]);
    conversations.save = async () => {
      throw { code: 'PGRST204', message: "Could not find the 'last_message' column" };
    };
    const listed = await new GetAllConversationsUseCase(
      conversations,
      new MemoryMessages([last]),
      new MemoryNumbers()
    ).execute();
    expect(listed[0].lastMessage?.content).toBe('preciso de ajuda');
  });

  it('execute(false) preenche a prévia e não grava', async () => {
    const conversations = new MemoryConversations([row()]);
    let saves = 0;
    conversations.save = async () => {
      saves += 1;
    };
    const listed = await new GetAllConversationsUseCase(
      conversations,
      new MemoryMessages([last]),
      new MemoryNumbers()
    ).execute(false);
    expect(listed[0].lastMessage?.content).toBe('preciso de ajuda');
    expect(saves).toBe(0);
    expect(conversations.items[0].lastMessage).toBeUndefined();
  });
});
