import { Flow } from '../entities/Flow';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { PublishFlowUseCase } from './PublishFlowUseCase';

const now = new Date('2026-08-21T12:00:00Z');

const healthy: Flow = {
  id: 'inicio',
  name: 'Atendimento',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  steps: [{ id: 'hi', type: 'message', content: 'Oi' }],
};

class FakeFlows implements IFlowRepository {
  constructor(private items: Flow[]) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(flow: Flow) {
    this.items = [...this.items.filter((item) => item.id !== flow.id), flow];
  }
  async update(flow: Flow) {
    await this.save(flow);
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

describe('PublishFlowUseCase', () => {
  it('copia steps para publishedSteps', async () => {
    const flows = new FakeFlows([healthy]);
    const published = await new PublishFlowUseCase(flows).execute('inicio');
    expect(published?.publishedSteps).toEqual(healthy.steps);
  });

  it('recusa roteiro com problema', async () => {
    const broken: Flow = {
      ...healthy,
      steps: [
        { id: 'a', type: 'message', content: 'A' },
        { id: 'b', type: 'message', content: 'B' },
      ],
    };
    const flows = new FakeFlows([broken]);
    await expect(new PublishFlowUseCase(flows).execute('inicio')).rejects.toThrow(
      'Corrija os problemas do roteiro antes de publicar'
    );
  });
});
