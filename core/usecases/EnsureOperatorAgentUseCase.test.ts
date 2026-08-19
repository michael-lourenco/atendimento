import { Agent } from '../entities/Agent';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { EnsureOperatorAgentUseCase } from './EnsureOperatorAgentUseCase';
import { User } from '../entities/User';

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

const user: User = {
  id: 'uuid-1',
  email: 'eu@firma.com',
  name: 'Eu',
  role: 'admin',
  createdAt: new Date('2026-08-19'),
};

describe('EnsureOperatorAgentUseCase', () => {
  it('cria agente com o id do perfil', async () => {
    const repo = new MemoryAgents();
    const agent = await new EnsureOperatorAgentUseCase(repo).execute(user);
    expect(agent.id).toBe('uuid-1');
    expect(agent.email).toBe('eu@firma.com');
    expect(repo.items).toHaveLength(1);
  });

  it('não duplica se já existe', async () => {
    const existing: Agent = {
      id: 'uuid-1',
      name: 'Eu',
      email: 'eu@firma.com',
      status: 'online',
      conversationsCount: 3,
      responseTime: '—',
      createdAt: user.createdAt,
    };
    const repo = new MemoryAgents([existing]);
    const agent = await new EnsureOperatorAgentUseCase(repo).execute(user);
    expect(agent.conversationsCount).toBe(3);
    expect(repo.items).toHaveLength(1);
  });

  it('não duplica se o e-mail já existe com outro id', async () => {
    const existing: Agent = {
      id: 'agent-old',
      name: 'Michael',
      email: 'DevMichaelLourenco@gmail.com',
      status: 'online',
      conversationsCount: 1,
      responseTime: '—',
      createdAt: user.createdAt,
    };
    const repo = new MemoryAgents([existing]);
    const agent = await new EnsureOperatorAgentUseCase(repo).execute({
      ...user,
      id: 'uuid-2',
      email: 'devmichaellourenco@gmail.com',
    });
    expect(agent.id).toBe('agent-old');
    expect(repo.items).toHaveLength(1);
  });
});
