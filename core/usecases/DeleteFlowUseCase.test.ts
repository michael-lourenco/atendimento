import { Flow } from '../entities/Flow';
import { FlowSession } from '../entities/FlowSession';
import { Chatbot } from '../entities/Chatbot';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { DeleteFlowUseCase } from './DeleteFlowUseCase';

const now = new Date('2026-08-19T22:00:00Z');

class InMemoryFlowRepository implements IFlowRepository {
  constructor(private flows: Flow[]) {}
  async getAll() {
    return [...this.flows];
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
  constructor(private sessions: FlowSession[] = []) {}
  async getByContactId(contactId: string) {
    return this.sessions.find((session) => session.contactId === contactId) ?? null;
  }
  async listByFlowId(flowId: string) {
    return this.sessions.filter((session) => session.flowId === flowId);
  }
  async save(session: FlowSession) {
    this.sessions = [
      ...this.sessions.filter((item) => item.contactId !== session.contactId),
      session,
    ];
  }
  async deleteByFlowId(flowId: string) {
    this.sessions = this.sessions.filter((session) => session.flowId !== flowId);
  }
}

class InMemoryChatbotRepository implements IChatbotRepository {
  constructor(private bots: Chatbot[] = []) {}
  async getAll() {
    return [...this.bots];
  }
  async getById(id: string) {
    return this.bots.find((bot) => bot.id === id) ?? null;
  }
  async save(bot: Chatbot) {
    this.bots = [...this.bots.filter((item) => item.id !== bot.id), bot];
  }
  async delete(id: string) {
    this.bots = this.bots.filter((bot) => bot.id !== id);
  }
}

class InMemoryNumberRepository implements IWhatsAppNumberRepository {
  constructor(private items: WhatsAppNumber[] = []) {}
  async getAll() {
    return [...this.items];
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(item: WhatsAppNumber) {
    this.items = [...this.items.filter((row) => row.id !== item.id), item];
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

describe('DeleteFlowUseCase', () => {
  it('apaga o fluxo, as sessões daquele roteiro e solta o chatbot', async () => {
    const teste: Flow = {
      id: 'teste',
      name: 'Teste',
      isActive: true,
      steps: [],
      createdAt: now,
      updatedAt: now,
    };
    const flows = new InMemoryFlowRepository([teste]);
    const sessions = new InMemorySessionRepository([
      {
        contactId: '5511999999999',
        flowId: 'teste',
        currentStepId: 'ask',
        paused: false,
        updatedAt: now,
      },
      {
        contactId: '5511888888888',
        flowId: 'inicio',
        currentStepId: 'menu',
        paused: false,
        updatedAt: now,
      },
    ]);
    const chatbots = new InMemoryChatbotRepository([
      {
        id: 'bot-1',
        name: 'Bot',
        isActive: true,
        flowId: 'teste',
        messagesCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const numbers = new InMemoryNumberRepository([
      {
        id: 'n-1',
        name: 'Comercial',
        number: '5511',
        status: 'active',
        provider: 'evolution',
        flowId: 'teste',
        createdAt: now,
      },
    ]);

    await new DeleteFlowUseCase(flows, sessions, chatbots, numbers).execute('teste');

    expect(await flows.getById('teste')).toBeNull();
    expect(await sessions.getByContactId('5511999999999')).toBeNull();
    expect((await sessions.getByContactId('5511888888888'))?.flowId).toBe('inicio');
    expect((await chatbots.getById('bot-1'))?.flowId).toBeUndefined();
    expect((await numbers.getById('n-1'))?.flowId).toBeUndefined();
  });
});
