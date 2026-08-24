import { Message } from '../entities/Message';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { Flow } from '../entities/Flow';
import { FlowSession } from '../entities/FlowSession';
import { IWhatsAppService, SendMessageParams, WhatsAppMessageResponse } from '../services/IWhatsAppService';
import { HandleIncomingWhatsAppMessageUseCase } from './HandleIncomingWhatsAppMessageUseCase';
import { ProcessIncomingFlowUseCase } from './ProcessIncomingFlowUseCase';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { UpsertConversationFromMessageUseCase } from './UpsertConversationFromMessageUseCase';
import { UpsertContactFromIncomingUseCase } from './UpsertContactFromIncomingUseCase';
import { IContactRepository } from '../repositories/IContactRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { Contact } from '../entities/Contact';
import { Conversation } from '../entities/Conversation';

const now = new Date('2026-08-21T15:00:00Z');

const inicio: Flow = {
  id: 'inicio',
  name: 'Atendimento Inicial',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  steps: [
    { id: 'welcome', type: 'message', content: 'Olá', nextStepId: 'ask' },
    { id: 'ask', type: 'question', content: 'Qual área?' },
  ],
};

function incoming(id: string): Message {
  return {
    id,
    from: '5511999999999',
    to: 'bot',
    content: 'Oie',
    type: 'text',
    timestamp: now,
    direction: 'incoming',
    status: 'sent',
  };
}

class MemoryMessages implements IMessageRepository {
  items: Message[] = [];
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

class MemoryFlows implements IFlowRepository {
  constructor(private flows: Flow[]) {}
  async getAll() {
    return this.flows;
  }
  async getById(id: string) {
    return this.flows.find((item) => item.id === id) ?? null;
  }
  async save() {}
  async update() {}
  async delete() {}
}

class MemorySessions implements IFlowSessionRepository {
  private sessions = new Map<string, FlowSession>();
  async getByContactId(contactId: string) {
    return this.sessions.get(contactId) ?? null;
  }
  async listByFlowId() {
    return [];
  }
  async save(session: FlowSession) {
    this.sessions.set(session.contactId, session);
  }
  async deleteByFlowId() {}
}

class FakeWhatsApp implements IWhatsAppService {
  sent: SendMessageParams[] = [];
  async sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    this.sent.push(params);
    return {
      messaging_product: 'whatsapp',
      contacts: [{ input: params.to, wa_id: params.to }],
      messages: [{ id: `wamid-${this.sent.length}` }],
    };
  }
  verifyWebhook() {
    return null;
  }
  async processWebhook() {
    return [];
  }
  async fetchProfilePicture() {
    return null;
  }
}

class MemoryContacts implements IContactRepository {
  items = new Map<string, Contact>();
  async getAll() {
    return [...this.items.values()];
  }
  async getById(id: string) {
    return this.items.get(id) ?? null;
  }
  async save(contact: Contact) {
    this.items.set(contact.id, contact);
  }
  async delete() {}
}

class MemoryConversations implements IConversationRepository {
  items = new Map<string, Conversation>();
  async getAll() {
    return [...this.items.values()];
  }
  async getById(id: string) {
    return this.items.get(id) ?? null;
  }
  async getByDepartment() {
    return [];
  }
  async getByAgent() {
    return [];
  }
  async save(conversation: Conversation) {
    this.items.set(conversation.id, conversation);
  }
  async delete() {}
}

function createHandler() {
  const whatsApp = new FakeWhatsApp();
  const messages = new MemoryMessages();
  const contacts = new MemoryContacts();
  const conversations = new MemoryConversations();
  const send = new SendWhatsAppMessageUseCase(whatsApp, messages);
  const processFlow = new ProcessIncomingFlowUseCase(
    new MemoryFlows([inicio]),
    new MemorySessions(),
    send
  );
  const numbers = {
    async getAll() {
      return [];
    },
    async getById() {
      return null;
    },
    async save() {},
    async delete() {},
  };
  const handler = new HandleIncomingWhatsAppMessageUseCase(
    whatsApp,
    messages,
    processFlow,
    new UpsertConversationFromMessageUseCase(conversations, contacts, numbers),
    new UpsertContactFromIncomingUseCase(contacts)
  );
  return { handler, whatsApp, messages };
}

describe('HandleIncomingWhatsAppMessageUseCase', () => {
  it('não dispara o motor de novo no mesmo id de mensagem', async () => {
    const { handler, whatsApp } = createHandler();
    const message = incoming('wamid-1');

    await handler.executeMessages([message]);
    await handler.executeMessages([message]);

    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Olá', 'Qual área?']);
  });
});
