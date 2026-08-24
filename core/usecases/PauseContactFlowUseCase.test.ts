import { Flow } from '../entities/Flow';
import { FlowSession } from '../entities/FlowSession';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { PauseContactFlowUseCase } from './PauseContactFlowUseCase';
import { ResumeContactFlowUseCase } from './ResumeContactFlowUseCase';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { Chatbot } from '../entities/Chatbot';

const now = new Date('2026-08-18T15:00:00Z');

const sampleFlow: Flow = {
  id: 'inicio',
  name: 'Atendimento Inicial',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  steps: [{ id: 'welcome', type: 'message', content: 'Olá' }],
};

class InMemoryFlowRepository implements IFlowRepository {
  constructor(private flows: Flow[]) {}
  async getAll() {
    return this.flows;
  }
  async getById(id: string) {
    return this.flows.find((flow) => flow.id === id) ?? null;
  }
  async save() {}
  async update() {}
  async delete() {}
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
    this.sessions.set(session.contactId, { ...session });
  }
  async deleteByFlowId(flowId: string) {
    for (const [contactId, session] of this.sessions) {
      if (session.flowId === flowId) {
        this.sessions.delete(contactId);
      }
    }
  }
}

describe('PauseContactFlowUseCase / ResumeContactFlowUseCase', () => {
  it('pausa sessão existente e retomar zera o passo', async () => {
    const sessions = new InMemorySessionRepository();
    await sessions.save({
      contactId: '5521982790723',
      flowId: 'inicio',
      currentStepId: 'ask',
      paused: false,
      updatedAt: now,
    });
    const pause = new PauseContactFlowUseCase(sessions, new InMemoryFlowRepository([sampleFlow]));
    const resume = new ResumeContactFlowUseCase(sessions);

    await pause.execute('5521982790723');
    expect((await sessions.getByContactId('5521982790723'))?.paused).toBe(true);
    expect((await sessions.getByContactId('5521982790723'))?.currentStepId).toBe('ask');

    await resume.execute('5521982790723');
    const after = await sessions.getByContactId('5521982790723');
    expect(after?.paused).toBe(false);
    expect(after?.currentStepId).toBeNull();
  });

  it('sem sessão cria uma pausada no fluxo ativo', async () => {
    const sessions = new InMemorySessionRepository();
    const pause = new PauseContactFlowUseCase(sessions, new InMemoryFlowRepository([sampleFlow]));

    await pause.execute('5521982790723');

    const session = await sessions.getByContactId('5521982790723');
    expect(session?.paused).toBe(true);
    expect(session?.flowId).toBe('inicio');
  });

  it('sem sessão cria no fluxo de entrada do chatbot', async () => {
    const faq: Flow = { ...sampleFlow, id: 'faq', name: 'FAQ' };
    const chatbots: IChatbotRepository = {
      getAll: async () =>
        [
          {
            id: '1',
            name: 'Bot',
            isActive: true,
            flowId: 'faq',
            messagesCount: 0,
            createdAt: now,
            updatedAt: now,
          },
        ] satisfies Chatbot[],
      getById: async () => null,
      save: async () => {},
      delete: async () => {},
    };
    const sessions = new InMemorySessionRepository();
    const pause = new PauseContactFlowUseCase(
      sessions,
      new InMemoryFlowRepository([sampleFlow, faq]),
      chatbots
    );
    await pause.execute('5521982790723');
    expect((await sessions.getByContactId('5521982790723'))?.flowId).toBe('faq');
  });

  it('sem sessão na linha usa o fluxo da linha', async () => {
    const faq: Flow = { ...sampleFlow, id: 'faq', name: 'FAQ' };
    const chatbots: IChatbotRepository = {
      getAll: async () =>
        [
          {
            id: '1',
            name: 'Bot',
            isActive: true,
            flowId: 'inicio',
            messagesCount: 0,
            createdAt: now,
            updatedAt: now,
          },
        ] satisfies Chatbot[],
      getById: async () => null,
      save: async () => {},
      delete: async () => {},
    };
    const numbers = {
      getAll: async () => [],
      getById: async (id: string) =>
        id === 'n-sup'
          ? {
              id: 'n-sup',
              name: 'Suporte',
              number: '5511',
              status: 'active' as const,
              provider: 'evolution',
              flowId: 'faq',
              createdAt: now,
            }
          : null,
      save: async () => {},
      delete: async () => {},
    };
    const conversations = {
      getAll: async () => [],
      getById: async (id: string) =>
        id === 'thread-1'
          ? {
              id: 'thread-1',
              contactId: '5521982790723',
              contactName: 'Cliente',
              contactPhone: '5521982790723',
              status: 'open' as const,
              unreadCount: 0,
              lastActivity: now,
              createdAt: now,
              tags: [],
              whatsappNumberId: 'n-sup',
            }
          : null,
      getByDepartment: async () => [],
      getByAgent: async () => [],
      save: async () => {},
      delete: async () => {},
    };
    const sessions = new InMemorySessionRepository();
    const pause = new PauseContactFlowUseCase(
      sessions,
      new InMemoryFlowRepository([sampleFlow, faq]),
      chatbots,
      numbers,
      conversations
    );
    await pause.execute('thread-1');
    expect((await sessions.getByContactId('thread-1'))?.flowId).toBe('faq');
  });
});
