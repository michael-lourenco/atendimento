import { Message } from '../entities/Message';
import { Conversation } from '../entities/Conversation';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import {
  IWhatsAppService,
  MarkMessagesReadParams,
  SendMessageParams,
  WhatsAppMessageResponse,
  WhatsAppWebhookEntry,
} from '../services/IWhatsAppService';
import { MarkWhatsAppMessagesReadUseCase } from './MarkWhatsAppMessagesReadUseCase';

const now = new Date('2026-08-20T12:00:00Z');

const conversation: Conversation = {
  id: '5511:n1',
  contactId: '5511',
  contactName: 'Ana',
  contactPhone: '5511999999999',
  whatsappNumberId: 'n1',
  status: 'open',
  unreadCount: 2,
  lastActivity: now,
  createdAt: now,
  tags: [],
};

const line: WhatsAppNumber = {
  id: 'n1',
  name: 'Comercial',
  number: '5511000000001',
  status: 'active',
  provider: 'evolution',
  instanceName: 'comercial',
  createdAt: now,
};

const incoming = (overrides: Partial<Message> = {}): Message => ({
  id: 'wamid-1',
  from: '5511999999999',
  to: 'comercial',
  content: 'oi',
  type: 'text',
  timestamp: now,
  direction: 'incoming',
  status: 'delivered',
  ...overrides,
});

class MemoryMessages implements IMessageRepository {
  constructor(public items: Message[]) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async getByContact() {
    return this.items;
  }
  async save(message: Message) {
    this.items = [...this.items.filter((item) => item.id !== message.id), message];
  }
  async delete() {}
}

class MemoryConversations implements IConversationRepository {
  constructor(public items: Conversation[]) {}
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
  constructor(public items: WhatsAppNumber[]) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save() {}
  async delete() {}
}

class FakeWhatsApp implements IWhatsAppService {
  sent: MarkMessagesReadParams[] = [];
  fail = false;
  async sendMessage(_params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    return { messaging_product: 'whatsapp', contacts: [], messages: [] };
  }
  async markMessagesRead(params: MarkMessagesReadParams) {
    if (this.fail) {
      throw new Error('provedor');
    }
    this.sent.push(params);
  }
  verifyWebhook() {
    return null;
  }
  async processWebhook(_entry: WhatsAppWebhookEntry): Promise<Message[]> {
    return [];
  }
  async fetchProfilePicture() {
    return null;
  }
}

describe('MarkWhatsAppMessagesReadUseCase', () => {
  it('envia ids incoming ainda não lidas e grava read', async () => {
    const whatsApp = new FakeWhatsApp();
    const messages = new MemoryMessages([
      incoming(),
      incoming({ id: 'out', direction: 'outgoing', from: 'comercial', to: '5511999999999' }),
      incoming({ id: 'already', status: 'read' }),
    ]);
    const result = await new MarkWhatsAppMessagesReadUseCase(
      whatsApp,
      new MemoryConversations([conversation]),
      messages,
      new MemoryNumbers([line])
    ).execute('5511:n1');
    expect(whatsApp.sent[0]).toMatchObject({
      to: '5511999999999',
      messageIds: ['wamid-1'],
      instanceName: 'comercial',
    });
    expect(result).toEqual({ marked: 1 });
    expect(messages.items.find((item) => item.id === 'wamid-1')?.status).toBe('read');
  });

  it('no-op no provedor ainda marca local', async () => {
    const whatsApp = {
      async sendMessage() {
        throw new Error('não');
      },
      verifyWebhook() {
        return null;
      },
      async processWebhook() {
        return [];
      },
      async fetchProfilePicture() {
        return null;
      },
    } as unknown as IWhatsAppService;
    const messages = new MemoryMessages([incoming()]);
    const result = await new MarkWhatsAppMessagesReadUseCase(
      whatsApp,
      new MemoryConversations([conversation]),
      messages,
      new MemoryNumbers([line])
    ).execute('5511:n1');
    expect(result).toEqual({ marked: 1 });
    expect(messages.items[0].status).toBe('read');
  });

  it('conversa inexistente não chama o provedor', async () => {
    const whatsApp = new FakeWhatsApp();
    const result = await new MarkWhatsAppMessagesReadUseCase(
      whatsApp,
      new MemoryConversations([conversation]),
      new MemoryMessages([incoming()]),
      new MemoryNumbers([line])
    ).execute('missing');
    expect(result).toBeNull();
    expect(whatsApp.sent).toEqual([]);
  });

  it('falha do provedor não marca local', async () => {
    const whatsApp = new FakeWhatsApp();
    whatsApp.fail = true;
    const messages = new MemoryMessages([incoming()]);
    const result = await new MarkWhatsAppMessagesReadUseCase(
      whatsApp,
      new MemoryConversations([conversation]),
      messages,
      new MemoryNumbers([line])
    ).execute('5511:n1');
    expect(result).toEqual({ marked: 0 });
    expect(messages.items[0].status).toBe('delivered');
  });
});
