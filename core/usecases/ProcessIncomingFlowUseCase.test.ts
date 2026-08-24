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
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { ZERO_BOT_BEHAVIOR, DEFAULT_BOT_BEHAVIOR } from '../entities/botBehavior';
import { salesIntakeFlows } from '../entities/atendimentoInicialFlow';

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
  async listByFlowId(flowId: string) {
    return [...this.sessions.values()].filter((session) => session.flowId === flowId);
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
      { ...base, id: 'img', content: '', type: 'image', direction: 'incoming' },
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

  it('duas linhas geram duas sessões', async () => {
    const whatsApp = new FakeWhatsAppService();
    const sessions = new InMemorySessionRepository();
    const send = new SendWhatsAppMessageUseCase(whatsApp, new InMemoryMessageRepository());
    const numbers = {
      async getAll() {
        return [
          {
            id: 'n-com',
            name: 'Comercial',
            number: '5511000000001',
            status: 'active' as const,
            provider: 'evolution',
            instanceName: 'comercial',
            createdAt: now,
          },
          {
            id: 'n-sup',
            name: 'Suporte',
            number: '5511000000002',
            status: 'active' as const,
            provider: 'evolution',
            instanceName: 'suporte',
            createdAt: now,
          },
        ];
      },
      async getById() {
        return null;
      },
      async save() {},
      async delete() {},
    };
    const useCase = new ProcessIncomingFlowUseCase(
      new InMemoryFlowRepository([sampleFlow]),
      sessions,
      send,
      null,
      null,
      numbers
    );
    const base = {
      from: '5511999999999',
      timestamp: now,
      type: 'text' as const,
      direction: 'incoming' as const,
      status: 'sent' as const,
      content: 'oi',
    };
    await useCase.executeForMessages([
      { ...base, id: 'a', to: 'comercial' },
      { ...base, id: 'b', to: 'suporte' },
    ]);
    expect(await sessions.getByContactId('5511999999999:n-com')).not.toBeNull();
    expect(await sessions.getByContactId('5511999999999:n-sup')).not.toBeNull();
  });

  it('conhecido sem pergunta à espera pula o Olá', async () => {
    const { useCase, whatsApp } = createUseCase([sampleFlow]);
    await useCase.execute({ contactId: '5511999999999', text: 'oi', audience: 'known' });
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Qual área?']);
  });

  it('reabertura conhecida despausa e mostra o menu', async () => {
    const { useCase, whatsApp, sessions } = createUseCase([sampleFlow]);
    await sessions.save({
      contactId: '5511999999999',
      flowId: 'inicio',
      currentStepId: 'ask',
      paused: true,
      updatedAt: now,
    });
    await useCase.execute({
      contactId: '5511999999999',
      text: 'oi',
      audience: 'known',
      reopened: true,
    });
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Qual área?']);
    expect((await sessions.getByContactId('5511999999999'))?.paused).toBe(false);
  });

  it('lote na mesma linha processa cada texto na ordem', async () => {
    const { useCase, whatsApp } = createUseCase([sampleFlow]);
    const base = {
      from: '5511999999999',
      to: 'bot',
      timestamp: now,
      type: 'text' as const,
      direction: 'incoming' as const,
      status: 'sent' as const,
    };
    await useCase.executeForMessages([
      { ...base, id: 'a', content: 'oi' },
      { ...base, id: 'b', content: 'oi de novo' },
    ]);
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Olá', 'Qual área?', 'Obrigado']);
  });

  it('conhecido com pergunta à espera trata o texto como resposta', async () => {
    const { useCase, whatsApp, sessions } = createUseCase([sampleFlow]);
    await sessions.save({
      contactId: '5511999999999',
      flowId: 'inicio',
      currentStepId: 'ask',
      paused: false,
      updatedAt: now,
    });
    await useCase.execute({
      contactId: '5511999999999',
      text: 'Vendas',
      audience: 'known',
    });
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Obrigado']);
  });

  it('entrada usa o flowId do chatbot ativo', async () => {
    const faq: Flow = {
      id: 'faq',
      name: 'FAQ',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      steps: [
        { id: 'hi', type: 'message', content: 'FAQ olá', nextStepId: 'ask' },
        { id: 'ask', type: 'question', content: 'Dúvida?' },
      ],
    };
    const chatbots: IChatbotRepository = {
      getAll: async () => [
        {
          id: '1',
          name: 'Bot',
          isActive: true,
          flowId: 'faq',
          messagesCount: 0,
          createdAt: now,
          updatedAt: now,
          behavior: ZERO_BOT_BEHAVIOR,
        },
      ],
      getById: async () => null,
      save: async () => {},
      delete: async () => {},
    };
    const whatsApp = new FakeWhatsAppService();
    const sessions = new InMemorySessionRepository();
    const send = new SendWhatsAppMessageUseCase(whatsApp, new InMemoryMessageRepository());
    const useCase = new ProcessIncomingFlowUseCase(
      new InMemoryFlowRepository([sampleFlow, faq]),
      sessions,
      send,
      null,
      null,
      null,
      chatbots
    );
    await useCase.execute({ contactId: '5511999999999', text: 'oi' });
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['FAQ olá', 'Dúvida?']);
    expect((await sessions.getByContactId('5511999999999'))?.flowId).toBe('faq');
  });

  it('entrada da linha sobrepõe o flowId do chatbot', async () => {
    const suporte: Flow = {
      id: 'suporte',
      name: 'Suporte',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      steps: [
        { id: 'hi', type: 'message', content: 'Suporte olá', nextStepId: 'ask' },
        { id: 'ask', type: 'question', content: 'Qual chamado?' },
      ],
    };
    const chatbots: IChatbotRepository = {
      getAll: async () => [
        {
          id: '1',
          name: 'Bot',
          isActive: true,
          flowId: 'inicio',
          messagesCount: 0,
          createdAt: now,
          updatedAt: now,
          behavior: ZERO_BOT_BEHAVIOR,
        },
      ],
      getById: async () => null,
      save: async () => {},
      delete: async () => {},
    };
    const numbers: IWhatsAppNumberRepository = {
      getAll: async () => [
        {
          id: 'n-sup',
          name: 'Suporte',
          number: '5511000000002',
          status: 'active',
          provider: 'evolution',
          instanceName: 'suporte',
          flowId: 'suporte',
          createdAt: now,
        },
      ],
      getById: async () => null,
      save: async () => {},
      delete: async () => {},
    };
    const whatsApp = new FakeWhatsAppService();
    const sessions = new InMemorySessionRepository();
    const send = new SendWhatsAppMessageUseCase(whatsApp, new InMemoryMessageRepository());
    const useCase = new ProcessIncomingFlowUseCase(
      new InMemoryFlowRepository([sampleFlow, suporte]),
      sessions,
      send,
      null,
      null,
      numbers,
      chatbots
    );
    await useCase.execute({
      contactId: '5511999999999',
      text: 'oi',
      instanceName: 'suporte',
    });
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Suporte olá', 'Qual chamado?']);
    expect((await sessions.getByContactId('5511999999999'))?.flowId).toBe('suporte');
  });

  it('três incoming concorrentes na mesma thread: uma abertura e o burst não gera miss', async () => {
    const whatsApp = new FakeWhatsAppService();
    const sessions = new InMemorySessionRepository();
    const messages = new InMemoryMessageRepository();
    const t1 = new Date('2026-08-18T15:00:00Z');
    const t2 = new Date('2026-08-18T15:00:01Z');
    const t3 = new Date('2026-08-18T15:00:02Z');
    const phone = '5511999999999';
    const base = {
      from: phone,
      to: 'bot',
      type: 'text' as const,
      direction: 'incoming' as const,
      status: 'sent' as const,
    };
    messages.messages = [
      { ...base, id: '1', content: 'Oie', timestamp: t1 },
      { ...base, id: '2', content: 'Td bem?', timestamp: t2 },
      {
        ...base,
        id: '3',
        content: 'Vai ter aula amanhã mesmo? Onde vai ser?',
        timestamp: t3,
      },
    ];
    const chatbots: IChatbotRepository = {
      getAll: async () => [
        {
          id: '1',
          name: 'Bot',
          isActive: true,
          messagesCount: 0,
          createdAt: now,
          updatedAt: now,
          behavior: { ...ZERO_BOT_BEHAVIOR, inboundDebounceMs: 800, missHandoffAfter: 3 },
        },
      ],
      getById: async () => null,
      save: async () => {},
      delete: async () => {},
    };
    const send = new SendWhatsAppMessageUseCase(whatsApp, new InMemoryMessageRepository());
    const useCase = new ProcessIncomingFlowUseCase(
      new InMemoryFlowRepository(salesIntakeFlows(now)),
      sessions,
      send,
      null,
      null,
      null,
      chatbots,
      null,
      { sleep: async () => undefined, messages }
    );

    await Promise.all([
      useCase.execute({ contactId: phone, text: 'Oie', incomingAt: t1 }),
      useCase.execute({ contactId: phone, text: 'Td bem?', incomingAt: t2 }),
      useCase.execute({
        contactId: phone,
        text: 'Vai ter aula amanhã mesmo? Onde vai ser?',
        incomingAt: t3,
      }),
    ]);

    const sent = whatsApp.sent.map((item) => item.message);
    expect(sent.filter((item) => item.startsWith('Oi, aqui é o Michael')).length).toBe(1);
    expect(sent.filter((item) => item.startsWith('Como posso te ajudar?')).length).toBe(1);
    expect(sent.filter((item) => item.startsWith('Não peguei')).length).toBe(0);
  });

  it('threads distintas processam o motor em paralelo', async () => {
    const { useCase, whatsApp } = createUseCase([sampleFlow]);

    await Promise.all([
      useCase.execute({ contactId: '5511111111111', text: 'oi' }),
      useCase.execute({ contactId: '5511222222222', text: 'oi' }),
    ]);

    expect(whatsApp.sent.filter((item) => item.message === 'Olá')).toHaveLength(2);
    expect(whatsApp.sent.filter((item) => item.message === 'Qual área?')).toHaveLength(2);
  });

  it('terceiro miss na pergunta faz handoff', async () => {
    const whatsApp = new FakeWhatsAppService();
    const sessions = new InMemorySessionRepository();
    const send = new SendWhatsAppMessageUseCase(whatsApp, new InMemoryMessageRepository());
    const chatbots: IChatbotRepository = {
      getAll: async () => [
        {
          id: '1',
          name: 'Bot',
          isActive: true,
          messagesCount: 0,
          createdAt: now,
          updatedAt: now,
          behavior: { ...DEFAULT_BOT_BEHAVIOR, inboundDebounceMs: 0, replyDelayMs: 0, bubbleDelayMs: 0 },
        },
      ],
      getById: async () => null,
      save: async () => {},
      delete: async () => {},
    };
    const useCase = new ProcessIncomingFlowUseCase(
      new InMemoryFlowRepository([sampleFlow]),
      sessions,
      send,
      null,
      null,
      null,
      chatbots,
      null,
      { sleep: async () => undefined }
    );
    await useCase.execute({ contactId: '5511999999999', text: 'oi' });
    await useCase.execute({ contactId: '5511999999999', text: 'x' });
    await useCase.execute({ contactId: '5511999999999', text: 'y' });
    whatsApp.sent = [];
    await useCase.execute({ contactId: '5511999999999', text: 'z' });
    expect(whatsApp.sent.map((item) => item.message)).toEqual([
      'Vou te passar para uma pessoa da equipe.',
    ]);
    expect((await sessions.getByContactId('5511999999999'))?.paused).toBe(true);
  });

  it('mídia na pergunta envia aviso uma vez', async () => {
    const whatsApp = new FakeWhatsAppService();
    const sessions = new InMemorySessionRepository();
    await sessions.save({
      contactId: '5511999999999',
      flowId: 'inicio',
      currentStepId: 'ask',
      paused: false,
      updatedAt: now,
    });
    const send = new SendWhatsAppMessageUseCase(whatsApp, new InMemoryMessageRepository());
    const chatbots: IChatbotRepository = {
      getAll: async () => [
        {
          id: '1',
          name: 'Bot',
          isActive: true,
          messagesCount: 0,
          createdAt: now,
          updatedAt: now,
          behavior: DEFAULT_BOT_BEHAVIOR,
        },
      ],
      getById: async () => null,
      save: async () => {},
      delete: async () => {},
    };
    const useCase = new ProcessIncomingFlowUseCase(
      new InMemoryFlowRepository([sampleFlow]),
      sessions,
      send,
      null,
      null,
      null,
      chatbots
    );
    const image = {
      id: 'img',
      from: '5511999999999',
      to: 'bot',
      content: '',
      type: 'image' as const,
      direction: 'incoming' as const,
      status: 'sent' as const,
      timestamp: now,
    };
    await useCase.executeForMessages([image]);
    await useCase.executeForMessages([{ ...image, id: 'img2' }]);
    expect(whatsApp.sent.map((item) => item.message)).toEqual([DEFAULT_BOT_BEHAVIOR.mediaHintMessage]);
  });

  it('motor usa publishedSteps e não o rascunho', async () => {
    const { useCase, whatsApp } = createUseCase([
      {
        ...sampleFlow,
        steps: [{ id: 'draft', type: 'message', content: 'RASCUNHO' }],
        publishedSteps: [
          { id: 'welcome', type: 'message', content: 'PUBLICADO', nextStepId: 'ask' },
          { id: 'ask', type: 'question', content: 'Qual área?' },
        ],
      },
    ]);
    await useCase.execute({ contactId: '5511999999999', text: 'oi' });
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['PUBLICADO', 'Qual área?']);
  });

  it('legenda da mídia avança como texto', async () => {
    const { useCase, whatsApp, sessions } = createUseCase([sampleFlow]);
    await sessions.save({
      contactId: '5511999999999',
      flowId: 'inicio',
      currentStepId: 'ask',
      paused: false,
      updatedAt: now,
    });
    await useCase.executeForMessages([
      {
        id: 'img',
        from: '5511999999999',
        to: 'bot',
        content: 'qualquer',
        type: 'image',
        direction: 'incoming',
        status: 'sent',
        timestamp: now,
      },
    ]);
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Obrigado']);
  });

  it('atalho humano pausa no meio da pergunta', async () => {
    const { useCase, whatsApp, sessions } = createUseCase([sampleFlow]);
    await useCase.execute({ contactId: '5511999999999', text: 'oi' });
    whatsApp.sent = [];
    await useCase.execute({ contactId: '5511999999999', text: 'quero um humano' });
    expect(whatsApp.sent.map((item) => item.message)).toEqual([
      'Vou te passar para uma pessoa da equipe.',
    ]);
    expect((await sessions.getByContactId('5511999999999'))?.paused).toBe(true);
  });

  it('passo órfão volta ao menu conhecido', async () => {
    const { useCase, whatsApp, sessions } = createUseCase([sampleFlow]);
    await sessions.save({
      contactId: '5511999999999',
      flowId: 'inicio',
      currentStepId: 'sumiu',
      paused: false,
      updatedAt: now,
    });
    await useCase.execute({ contactId: '5511999999999', text: 'oi' });
    expect(whatsApp.sent.map((item) => item.message)).toEqual(['Qual área?']);
  });
});
