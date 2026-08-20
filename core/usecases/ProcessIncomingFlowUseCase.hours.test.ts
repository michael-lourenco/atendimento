import { Flow } from '../entities/Flow';
import { Conversation } from '../entities/Conversation';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { Message } from '../entities/Message';
import {
  IWhatsAppService,
  SendMessageParams,
  WhatsAppMessageResponse,
  WhatsAppWebhookEntry,
} from '../services/IWhatsAppService';
import { FlowSession } from '../entities/FlowSession';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { SetConversationDepartmentUseCase } from './SetConversationDepartmentUseCase';
import { ProcessIncomingFlowUseCase } from './ProcessIncomingFlowUseCase';
import { ZERO_BOT_BEHAVIOR } from '../entities/botBehavior';

const now = new Date('2026-08-18T15:00:00Z');

const sampleFlow: Flow = {
  id: 'inicio',
  name: 'Atendimento Inicial',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  steps: [
    { id: 'welcome', type: 'message', content: 'Olá', nextStepId: 'ask' },
    { id: 'ask', type: 'question', content: 'Qual área?', nextStepId: 'end' },
  ],
};

class InMemoryFlowRepository implements IFlowRepository {
  constructor(private flows: Flow[]) {}
  async getAll() {
    return this.flows;
  }
  async getById(id: string) {
    return this.flows.find((flow) => flow.id === id) ?? null;
  }
  async save(flow: Flow) {
    this.flows = [...this.flows.filter((item) => item.id !== flow.id), flow];
  }
  async update(flow: Flow) {
    await this.save(flow);
  }
  async delete(id: string) {
    this.flows = this.flows.filter((flow) => flow.id !== id);
  }
}

class InMemorySessionRepository implements IFlowSessionRepository {
  private sessions = new Map<string, FlowSession>();
  async getByContactId(contactId: string) {
    return this.sessions.get(contactId) ?? null;
  }
  async save(session: FlowSession) {
    this.sessions.set(session.contactId, session);
  }
  async deleteByFlowId(flowId: string) {
    for (const [contactId, session] of this.sessions) {
      if (session.flowId === flowId) {
        this.sessions.delete(contactId);
      }
    }
  }
}

class InMemoryMessageRepository implements IMessageRepository {
  messages: Message[] = [];
  async getAll() {
    return this.messages;
  }
  async getById(id: string) {
    return this.messages.find((message) => message.id === id) ?? null;
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
    save: async (conversation) => {
      const index = list.findIndex((item) => item.id === conversation.id);
      if (index >= 0) {
        list[index] = conversation;
      }
    },
    delete: async () => {},
  };
}

function salesDepartment(): IDepartmentRepository {
  return {
    getAll: async () => [],
    getById: async (id) =>
      id === '1'
        ? {
            id: '1',
            name: 'Vendas',
            color: '#3b82f6',
            isActive: true,
            agentsCount: 0,
            conversationsCount: 0,
            createdAt: now,
            updatedAt: now,
          }
        : null,
    save: async () => {},
    delete: async () => {},
  };
}

function closedChatbots(): IChatbotRepository {
  return {
    getAll: async () => [
      {
        id: '1',
        name: 'Bot',
        isActive: true,
        messagesCount: 0,
        createdAt: now,
        updatedAt: now,
        behavior: ZERO_BOT_BEHAVIOR,
        businessHours: {
          enabled: true,
          timezone: 'UTC',
          days: [],
          start: '08:00',
          end: '18:00',
          closedMessage: 'Estamos fechados agora.',
        },
      },
    ],
    getById: async () => null,
    save: async () => {},
    delete: async () => {},
  };
}

function alwaysOpenLine(): IWhatsAppNumberRepository {
  return {
    getAll: async () => [
      {
        id: 'n-sup',
        name: 'Suporte',
        number: '5511000000002',
        status: 'active',
        provider: 'evolution',
        instanceName: 'suporte',
        businessHours: {
          enabled: false,
          timezone: 'UTC',
          days: [],
          start: '08:00',
          end: '18:00',
          closedMessage: '',
        },
        createdAt: now,
      },
    ],
    getById: async () => null,
    save: async () => {},
    delete: async () => {},
  };
}

function flowHarness(args: {
  chatbots?: IChatbotRepository | null;
  numbers?: IWhatsAppNumberRepository | null;
  flows?: Flow[];
  setDepartment?: SetConversationDepartmentUseCase | null;
  departments?: IDepartmentRepository | null;
  conversations?: IConversationRepository | null;
}) {
  const whatsApp = new FakeWhatsAppService();
  const sessions = new InMemorySessionRepository();
  const send = new SendWhatsAppMessageUseCase(whatsApp, new InMemoryMessageRepository());
  const useCase = new ProcessIncomingFlowUseCase(
    new InMemoryFlowRepository(args.flows ?? [sampleFlow]),
    sessions,
    send,
    args.setDepartment ?? null,
    args.departments ?? null,
    args.numbers ?? null,
    args.chatbots ?? null,
    args.conversations ?? null
  );
  return { useCase, whatsApp, sessions };
}

describe('ProcessIncomingFlowUseCase horário e fila', () => {
  it('fora do expediente só avisa e não avança o fluxo', async () => {
    const { useCase, whatsApp, sessions } = flowHarness({ chatbots: closedChatbots() });
    await useCase.execute({ contactId: '5511999999999', text: 'oi' });
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Estamos fechados agora.']);
    expect((await sessions.getByContactId('5511999999999'))?.outsideHoursNotified).toBe(true);
    await useCase.execute({ contactId: '5511999999999', text: 'oi de novo' });
    expect(whatsApp.sent).toHaveLength(1);
  });

  it('linha com expediente próprio atende mesmo com a empresa fechada', async () => {
    const { useCase, whatsApp } = flowHarness({
      chatbots: closedChatbots(),
      numbers: alwaysOpenLine(),
    });
    await useCase.execute({
      contactId: '5511999999999',
      text: 'oi',
      instanceName: 'suporte',
    });
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Olá', 'Qual área?']);
  });

  it('handoff acrescenta a posição na fila', async () => {
    const handoffFlow: Flow = {
      ...sampleFlow,
      steps: [
        {
          id: 'h',
          type: 'action',
          content: 'Um humano vem.',
          action: { type: 'handoff', departmentId: '1' },
        },
      ],
    };
    const conversations: Conversation[] = [
      {
        id: 'older',
        contactId: '5511888888888',
        contactName: 'Antes',
        contactPhone: '5511888888888',
        status: 'waiting',
        unreadCount: 0,
        lastActivity: new Date('2026-08-18T14:00:00Z'),
        createdAt: now,
        tags: [],
        departmentId: '1',
        departmentName: 'Vendas',
      },
      {
        id: '5511999999999',
        contactId: '5511999999999',
        contactName: 'Cliente',
        contactPhone: '5511999999999',
        status: 'open',
        unreadCount: 1,
        lastActivity: now,
        createdAt: now,
        tags: [],
      },
    ];
    const store = conversationStore(conversations);
    const { useCase, whatsApp, sessions } = flowHarness({
      flows: [handoffFlow],
      setDepartment: new SetConversationDepartmentUseCase(store),
      departments: salesDepartment(),
      conversations: store,
    });
    await useCase.execute({ contactId: '5511999999999', text: 'oi' });
    expect(whatsApp.sent.map((item) => item.message)).toEqual([
      'Um humano vem. Você é o 2 na fila.',
    ]);
    expect((await sessions.getByContactId('5511999999999'))?.paused).toBe(true);
  });
});
