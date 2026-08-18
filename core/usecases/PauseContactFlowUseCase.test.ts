import { Flow } from '../entities/Flow';
import { FlowSession } from '../entities/FlowSession';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { PauseContactFlowUseCase } from './PauseContactFlowUseCase';
import { ResumeContactFlowUseCase } from './ResumeContactFlowUseCase';

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
  async save(session: FlowSession) {
    this.sessions.set(session.contactId, { ...session });
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
});
