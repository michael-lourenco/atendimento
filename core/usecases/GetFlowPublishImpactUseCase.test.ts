import { Flow } from '../entities/Flow';
import { FlowSession } from '../entities/FlowSession';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { GetFlowPublishImpactUseCase } from './GetFlowPublishImpactUseCase';
import { countSessionsOnRemovedSteps } from '../entities/flowPublishImpact';

const now = new Date('2026-08-21T12:00:00Z');

const flow: Flow = {
  id: 'inicio',
  name: 'Atendimento',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  steps: [
    { id: 'hi', type: 'message', content: 'Oi' },
    { id: 'ask', type: 'question', content: 'Qual?' },
  ],
};

class FakeFlows implements IFlowRepository {
  constructor(private items: Flow[]) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(next: Flow) {
    this.items = [...this.items.filter((item) => item.id !== next.id), next];
  }
  async update(next: Flow) {
    await this.save(next);
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

class FakeSessions implements IFlowSessionRepository {
  constructor(private items: FlowSession[]) {}
  async getByContactId(contactId: string) {
    return this.items.find((item) => item.contactId === contactId) ?? null;
  }
  async listByFlowId(flowId: string) {
    return this.items.filter((item) => item.flowId === flowId);
  }
  async save(session: FlowSession) {
    this.items = [...this.items.filter((item) => item.contactId !== session.contactId), session];
  }
  async deleteByFlowId(flowId: string) {
    this.items = this.items.filter((item) => item.flowId !== flowId);
  }
}

describe('countSessionsOnRemovedSteps', () => {
  it('conta quem espera passo que vai sumir', () => {
    expect(
      countSessionsOnRemovedSteps(
        [
          { currentStepId: 'ask' },
          { currentStepId: 'ask' },
          { currentStepId: 'hi' },
          { currentStepId: null },
        ],
        ['hi']
      )
    ).toBe(2);
  });
});

describe('GetFlowPublishImpactUseCase', () => {
  it('conta sessões cujo passo some', async () => {
    const sessions = new FakeSessions([
      {
        contactId: 'a',
        flowId: 'inicio',
        currentStepId: 'ask',
        paused: false,
        updatedAt: now,
      },
      {
        contactId: 'b',
        flowId: 'inicio',
        currentStepId: 'hi',
        paused: false,
        updatedAt: now,
      },
    ]);
    const impact = await new GetFlowPublishImpactUseCase(new FakeFlows([flow]), sessions).execute(
      'inicio',
      [{ id: 'hi', type: 'message', content: 'Oi' }]
    );
    expect(impact.count).toBe(1);
  });
});
