import { Conversation } from '../entities/Conversation';
import { FlowSession } from '../entities/FlowSession';
import { Message } from '../entities/Message';
import { Chatbot } from '../entities/Chatbot';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import {
  IWhatsAppService,
  SendMessageParams,
  WhatsAppMessageResponse,
  WhatsAppWebhookEntry,
} from '../services/IWhatsAppService';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { CloseConversationUseCase } from './CloseConversationUseCase';
import { DispatchIdleBotSessionsUseCase } from './DispatchIdleBotSessionsUseCase';
import { DEFAULT_BOT_BEHAVIOR } from '../entities/botBehavior';

const now = new Date('2026-08-20T16:00:00Z');
const lastIncomingAt = new Date('2026-08-20T15:29:00Z');

const conversation: Conversation = {
  id: '5511999999999',
  contactId: '5511999999999',
  contactName: 'Cliente',
  contactPhone: '5511999999999',
  status: 'open',
  unreadCount: 0,
  lastActivity: now,
  createdAt: now,
  tags: [],
};

const waiting: FlowSession = {
  contactId: '5511999999999',
  flowId: 'inicio',
  currentStepId: 'ask',
  paused: false,
  updatedAt: lastIncomingAt,
};

const incoming: Message = {
  id: 'in-1',
  from: '5511999999999',
  to: 'bot',
  content: 'oi',
  type: 'text',
  timestamp: lastIncomingAt,
  direction: 'incoming',
  status: 'sent',
};

class InMemorySessionRepository implements IFlowSessionRepository {
  constructor(private session: FlowSession | null) {}
  async getByContactId(contactId: string) {
    return this.session?.contactId === contactId ? this.session : null;
  }
  async save(session: FlowSession) {
    this.session = session;
  }
  async deleteByFlowId() {}
}

class InMemoryMessageRepository implements IMessageRepository {
  constructor(private messages: Message[]) {}
  async getAll() {
    return this.messages;
  }
  async getById(id: string) {
    return this.messages.find((item) => item.id === id) ?? null;
  }
  async getByContact() {
    return this.messages;
  }
  async save(message: Message) {
    this.messages.push(message);
  }
  async delete() {}
}

class FakeWhatsAppService implements IWhatsAppService {
  sent: SendMessageParams[] = [];
  async sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    this.sent.push(params);
    return {
      messaging_product: 'whatsapp',
      contacts: [{ input: params.to, wa_id: params.to }],
      messages: [{ id: `wamid-${this.sent.length}` }],
    };
  }
  verifyWebhook(): string | null {
    return null;
  }
  async processWebhook(_entry: WhatsAppWebhookEntry): Promise<Message[]> {
    return [];
  }
  async fetchProfilePicture() {
    return null;
  }
}

function conversationStore(list: Conversation[]): IConversationRepository {
  return {
    getAll: async () => list,
    getById: async (id) => list.find((item) => item.id === id) ?? null,
    getByDepartment: async () => [],
    getByAgent: async () => [],
    save: async (item) => {
      const index = list.findIndex((row) => row.id === item.id);
      if (index >= 0) {
        list[index] = item;
      }
    },
    delete: async () => {},
  };
}

function bots(partial: Chatbot['behavior']): IChatbotRepository {
  return {
    getAll: async () => [
      {
        id: '1',
        name: 'Bot',
        isActive: true,
        messagesCount: 0,
        createdAt: now,
        updatedAt: now,
        behavior: { ...DEFAULT_BOT_BEHAVIOR, ...partial },
      },
    ],
    getById: async () => null,
    save: async () => {},
    delete: async () => {},
  };
}

function createUseCase(input: {
  conversation: Conversation;
  session: FlowSession | null;
  idleMinutes?: number;
}) {
  const list = [{ ...input.conversation }];
  const store = conversationStore(list);
  const sessions = new InMemorySessionRepository(input.session);
  const whatsApp = new FakeWhatsAppService();
  const messages = new InMemoryMessageRepository([{ ...incoming }]);
  const useCase = new DispatchIdleBotSessionsUseCase(
    bots({ idleContactMinutes: input.idleMinutes ?? 30 }),
    store,
    sessions,
    messages,
    new SendWhatsAppMessageUseCase(whatsApp, messages),
    new CloseConversationUseCase(store)
  );
  return { useCase, whatsApp, sessions, list };
}

describe('DispatchIdleBotSessionsUseCase', () => {
  it('fecha na pergunta parada', async () => {
    const { useCase, whatsApp, sessions, list } = createUseCase({
      conversation,
      session: waiting,
    });
    const result = await useCase.execute(now);
    expect(result.closed).toEqual(['5511999999999']);
    expect(whatsApp.sent[0]?.message).toContain('encerramos');
    expect(list[0].status).toBe('closed');
    expect((await sessions.getByContactId('5511999999999'))?.paused).toBe(true);
  });

  it('não fecha se paused', async () => {
    const { useCase, whatsApp, list } = createUseCase({
      conversation,
      session: { ...waiting, paused: true },
    });
    const result = await useCase.execute(now);
    expect(result.closed).toEqual([]);
    expect(whatsApp.sent).toEqual([]);
    expect(list[0].status).toBe('open');
  });

  it('0 minutos desliga o idle', async () => {
    const { useCase, list } = createUseCase({
      conversation,
      session: waiting,
      idleMinutes: 0,
    });
    expect((await useCase.execute(now)).closed).toEqual([]);
    expect(list[0].status).toBe('open');
  });

  it('idle 0 na linha não fecha', async () => {
    const list = [{ ...conversation, whatsappNumberId: 'n1' }];
    const store = conversationStore(list);
    const sessions = new InMemorySessionRepository(waiting);
    const messages = new InMemoryMessageRepository([{ ...incoming }]);
    const numbers: IWhatsAppNumberRepository = {
      getAll: async () => [
        {
          id: 'n1',
          name: 'Comercial',
          number: '5511000000001',
          status: 'active',
          provider: 'evolution',
          behavior: { idleContactMinutes: 0 },
          createdAt: now,
        },
      ],
      getById: async () => null,
      save: async () => {},
      delete: async () => {},
    };
    const useCase = new DispatchIdleBotSessionsUseCase(
      bots({ idleContactMinutes: 30 }),
      store,
      sessions,
      messages,
      new SendWhatsAppMessageUseCase(new FakeWhatsAppService(), messages),
      new CloseConversationUseCase(store),
      numbers
    );
    expect((await useCase.execute(now)).closed).toEqual([]);
    expect(list[0].status).toBe('open');
  });
});
