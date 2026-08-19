import { Agent } from '../entities/Agent';
import { IAuthRepository, CreateOperatorInput } from '../repositories/IAuthRepository';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { AuthUser, User } from '../entities/User';
import { DeleteOperatorUseCase } from './DeleteOperatorUseCase';

const admin: User = {
  id: 'a1',
  email: 'admin@x.com',
  name: 'Admin',
  role: 'admin',
  createdAt: new Date('2026-08-19'),
};

const michael: User = {
  id: 'm1',
  email: 'devmichaellourenco@gmail.com',
  name: 'Michael Dev',
  role: 'admin',
  createdAt: new Date('2026-08-19'),
};

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
  constructor(public users: User[]) {}
  async login(): Promise<AuthUser | null> {
    return null;
  }
  async logout() {}
  async getCurrentUser() {
    return this.users[0] ?? null;
  }
  async isAuthenticated() {
    return this.users.length > 0;
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
      createdAt: admin.createdAt,
    };
  }
  async setOperatorRole(id: string, role: 'admin' | 'user') {
    const user = this.users.find((item) => item.id === id);
    if (!user) return false;
    user.role = role;
    return true;
  }
  async setOperatorPassword(id: string) {
    return this.users.some((item) => item.id === id);
  }
  async deleteOperator(id: string) {
    const before = this.users.length;
    this.users = this.users.filter((item) => item.id !== id);
    return this.users.length < before;
  }
}

function agentFor(user: User, overrides: Partial<Agent> = {}): Agent {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: 'online',
    conversationsCount: 0,
    responseTime: '—',
    createdAt: user.createdAt,
    ...overrides,
  };
}

describe('DeleteOperatorUseCase', () => {
  it('exclui login e agente, mantém o outro e-mail', async () => {
    const keep: User = {
      id: 'k1',
      email: 'devmihcaellourenco@gmail.com',
      name: 'Atendente',
      role: 'admin',
      createdAt: admin.createdAt,
    };
    const auth = new FakeAuth([michael, keep]);
    const agents = new MemoryAgents([
      agentFor(michael),
      agentFor(keep, { name: 'Atendente' }),
    ]);
    await new DeleteOperatorUseCase(auth, agents).execute(keep, michael.id);
    expect(auth.users.map((item) => item.email)).toEqual(['devmihcaellourenco@gmail.com']);
    expect(agents.items.map((item) => item.email)).toEqual(['devmihcaellourenco@gmail.com']);
  });

  it('bloqueia excluir o último admin', async () => {
    const auth = new FakeAuth([michael]);
    const agents = new MemoryAgents([agentFor(michael)]);
    await expect(new DeleteOperatorUseCase(auth, agents).execute(michael, michael.id)).rejects.toMatchObject(
      { status: 400 }
    );
    expect(auth.users).toHaveLength(1);
    expect(agents.items).toHaveLength(1);
  });
});
