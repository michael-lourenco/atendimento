import { Agent } from '../entities/Agent';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository, CreateOperatorInput } from '../repositories/IAuthRepository';
import { AuthUser, User } from '../entities/User';
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

class FakeAuth implements IAuthRepository {
  constructor(
    public current: User,
    public users: User[]
  ) {}
  async login(): Promise<AuthUser | null> {
    return null;
  }
  async logout() {}
  async getCurrentUser() {
    return this.current;
  }
  async isAuthenticated() {
    return true;
  }
  async listOperators() {
    return [...this.users];
  }
  async createOperator(input: CreateOperatorInput) {
    return {
      id: `u-${input.email}`,
      email: input.email,
      name: input.name,
      role: input.role,
      createdAt: this.current.createdAt,
    };
  }
  async setOperatorRole() {
    return false;
  }
  async setOperatorPassword() {
    return false;
  }
  async deleteOperator() {
    return false;
  }
}

const now = new Date('2026-08-19');

const admin: User = {
  id: '1',
  email: 'devmichaellourenco@gmail.com',
  name: 'Michael',
  role: 'admin',
  createdAt: now,
};

const otherAdmin: User = {
  id: '2',
  email: 'outro@empresa.com',
  name: 'Outro',
  role: 'admin',
  createdAt: now,
};

const michael: Agent = {
  id: '1',
  name: 'Michael',
  email: 'devmichaellourenco@gmail.com',
  status: 'online',
  conversationsCount: 0,
  responseTime: '—',
  createdAt: now,
};

const peer: Agent = {
  ...michael,
  id: '2',
  name: 'Outro',
  email: 'outro@empresa.com',
};

describe('AgentCatalogUseCase', () => {
  it('recusa outro id com o mesmo e-mail', async () => {
    const catalog = new AgentCatalogUseCase(
      new MemoryAgents([michael]),
      new FakeAuth(admin, [admin])
    );
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
    const catalog = new AgentCatalogUseCase(
      new MemoryAgents([michael]),
      new FakeAuth(admin, [admin])
    );
    await catalog.save({ ...michael, name: 'Michael Lourenço' });
    expect((await catalog.list())[0].name).toBe('Michael Lourenço');
  });

  it('recusa desativar a si', async () => {
    const catalog = new AgentCatalogUseCase(
      new MemoryAgents([michael, peer]),
      new FakeAuth(admin, [admin, otherAdmin])
    );
    await expect(catalog.save({ ...michael, status: 'offline' })).rejects.toMatchObject({
      status: 403,
      message: 'Não é possível desativar este atendente',
    });
  });

  it('desativa outro admin se ainda houver um online', async () => {
    const catalog = new AgentCatalogUseCase(
      new MemoryAgents([michael, peer]),
      new FakeAuth(admin, [admin, otherAdmin])
    );
    await catalog.save({ ...peer, status: 'offline' });
    expect((await catalog.getById('2'))?.status).toBe('offline');
  });
});
