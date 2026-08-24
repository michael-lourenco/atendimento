import { Flow } from '../entities/Flow';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { SaveFlowUseCase } from './SaveFlowUseCase';

const now = new Date('2026-08-21T12:00:00Z');

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

describe('SaveFlowUseCase', () => {
  it('na primeira gravação copia o quadro para publishedSteps', async () => {
    const steps = [{ id: 'hi', type: 'message' as const, content: 'Oi' }];
    const repo = new FakeFlows([]);
    const saved = await new SaveFlowUseCase(repo).execute({
      id: 'inicio',
      name: 'Atendimento',
      isActive: true,
      steps,
      createdAt: now,
      updatedAt: now,
    });
    expect((await repo.getById('inicio'))?.publishedSteps).toEqual(steps);
    expect(saved.publishedSteps).toEqual(steps);
  });

  it('gravação seguinte não sobrescreve o publicado', async () => {
    const published = [{ id: 'hi', type: 'message' as const, content: 'No ar' }];
    const repo = new FakeFlows([
      {
        id: 'inicio',
        name: 'Atendimento',
        isActive: true,
        steps: published,
        publishedSteps: published,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const draft = [{ id: 'hi', type: 'message' as const, content: 'Rascunho' }];
    await new SaveFlowUseCase(repo).execute({
      id: 'inicio',
      name: 'Atendimento',
      isActive: true,
      steps: draft,
      createdAt: now,
      updatedAt: now,
    });
    const saved = await repo.getById('inicio');
    expect(saved?.steps).toEqual(draft);
    expect(saved?.publishedSteps).toEqual(published);
  });
});
