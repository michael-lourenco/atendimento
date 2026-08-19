import { Flow } from '../entities/Flow';
import { Message } from '../entities/Message';
import { Conversation } from '../entities/Conversation';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { IWhatsAppService, SendMessageParams, WhatsAppMessageResponse, WhatsAppWebhookEntry } from '../services/IWhatsAppService';
import { FlowSession } from '../entities/FlowSession';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { SetConversationDepartmentUseCase } from './SetConversationDepartmentUseCase';
import { ProcessIncomingFlowUseCase } from './ProcessIncomingFlowUseCase';

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
    { id: 'end', type: 'message', content: 'Obrigado' },
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
}

function createUseCase(flows: Flow[]) {
  const whatsApp = new FakeWhatsAppService();
  const messages = new InMemoryMessageRepository();
  const sessions = new InMemorySessionRepository();
  const send = new SendWhatsAppMessageUseCase(whatsApp, messages);
  const useCase = new ProcessIncomingFlowUseCase(
    new InMemoryFlowRepository(flows),
    sessions,
    send
  );
  return { useCase, whatsApp, sessions };
}

describe('ProcessIncomingFlowUseCase', () => {
  it('persiste sessão e envia respostas do fluxo', async () => {
    const { useCase, whatsApp, sessions } = createUseCase([sampleFlow]);

    await useCase.execute({ contactId: '5511999999999', text: 'oi' });

    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Olá', 'Qual área?']);
    const session = await sessions.getByContactId('5511999999999');
    expect(session?.currentStepId).toBe('ask');
    expect(session?.flowId).toBe('inicio');
  });

  it('não envia quando não há fluxo ativo', async () => {
    const { useCase, whatsApp, sessions } = createUseCase([
      { ...sampleFlow, isActive: false },
    ]);

    await useCase.execute({ contactId: '5511999999999', text: 'oi' });

    expect(whatsApp.sent).toEqual([]);
    expect(await sessions.getByContactId('5511999999999')).toBeNull();
  });

  it('executeForMessages ignora mídia e outgoing', async () => {
    const { useCase, whatsApp } = createUseCase([sampleFlow]);
    const base = {
      id: '1',
      from: '5511999999999',
      to: 'bot',
      timestamp: now,
      status: 'sent' as const,
    };

    await useCase.executeForMessages([
      { ...base, id: 'img', content: 'foto', type: 'image', direction: 'incoming' },
      { ...base, id: 'out', content: 'já enviada', type: 'text', direction: 'outgoing' },
    ]);

    expect(whatsApp.sent).toEqual([]);
  });

  it('não responde quando a sessão está pausada', async () => {
    const { useCase, whatsApp, sessions } = createUseCase([sampleFlow]);
    await sessions.save({
      contactId: '5511999999999',
      flowId: 'inicio',
      currentStepId: 'ask',
      paused: true,
      updatedAt: now,
    });

    await useCase.execute({ contactId: '5511999999999', text: 'oi' });

    expect(whatsApp.sent).toEqual([]);
    const session = await sessions.getByContactId('5511999999999');
    expect(session?.paused).toBe(true);
    expect(session?.currentStepId).toBe('ask');
  });

  it('action setDepartment grava o setor da conversa', async () => {
    const triage: Flow = {
      ...sampleFlow,
      steps: [
        { id: 'ask', type: 'question', content: 'Qual área?', nextStepId: 'set_vendas' },
        {
          id: 'set_vendas',
          type: 'action',
          content: '',
          nextStepId: 'ok',
          action: { type: 'setDepartment', departmentId: '1' },
        },
        { id: 'ok', type: 'message', content: 'Vendas ok' },
      ],
    };
    const conversations: Conversation[] = [
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
    const conversationRepo: IConversationRepository = {
      getAll: async () => conversations,
      getById: async (id) => conversations.find((item) => item.id === id) ?? null,
      getByDepartment: async () => [],
      getByAgent: async () => [],
      save: async (conversation) => {
        conversations[0] = conversation;
      },
      delete: async () => {},
    };
    const departmentRepo: IDepartmentRepository = {
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
    const whatsApp = new FakeWhatsAppService();
    const send = new SendWhatsAppMessageUseCase(whatsApp, new InMemoryMessageRepository());
    const sessions = new InMemorySessionRepository();
    await sessions.save({
      contactId: '5511999999999',
      flowId: 'inicio',
      currentStepId: 'ask',
      paused: false,
      updatedAt: now,
    });
    const useCase = new ProcessIncomingFlowUseCase(
      new InMemoryFlowRepository([triage]),
      sessions,
      send,
      new SetConversationDepartmentUseCase(conversationRepo),
      departmentRepo
    );

    await useCase.execute({ contactId: '5511999999999', text: 'Vendas' });

    expect(conversations[0].departmentId).toBe('1');
    expect(conversations[0].departmentName).toBe('Vendas');
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Vendas ok']);
  });
});
