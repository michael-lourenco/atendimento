import { Agent } from '../entities/Agent';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { AgentCatalogUseCase } from './AgentCatalogUseCase';

class MemoryAgents implements IAgentRepository {
  constructor(public items: Agent[] = []) {}
  async getAll() {
    return [...this.items];
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(entity: Agent) {
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index >= 0) this.items[index] = entity;
    else this.items.push(entity);
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

const now = new Date('2026-08-19');

const michael: Agent = {
  id: '1',
  name: 'Michael',
  email: 'devmichaellourenco@gmail.com',
  status: 'online',
  conversationsCount: 0,
  responseTime: '—',
  createdAt: now,
};

describe('AgentCatalogUseCase', () => {
  it('recusa outro id com o mesmo e-mail', async () => {
    const catalog = new AgentCatalogUseCase(new MemoryAgents([michael]));
    await expect(
      catalog.save({
        ...michael,
        id: '2',
        name: 'Outro',
        email: 'DevMichaelLourenco@gmail.com',
      })
    ).rejects.toMatchObject({ status: 409, message: 'Este e-mail já está cadastrado' });
    expect((await catalog.list()).map((item) => item.id)).toEqual(['1']);
  });

  it('permite atualizar o próprio cadastro', async () => {
    const catalog = new AgentCatalogUseCase(new MemoryAgents([michael]));
    await catalog.save({ ...michael, name: 'Michael Lourenço' });
    expect((await catalog.list())[0].name).toBe('Michael Lourenço');
  });
});
