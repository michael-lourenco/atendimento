import { Agent } from '../entities/Agent';
import { AuthUser, User } from '../entities/User';
import { LoginDeniedError } from '../entities/loginDenied';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { EnsureOperatorAgentUseCase } from './EnsureOperatorAgentUseCase';
import { GetCurrentUserUseCase } from './GetCurrentUserUseCase';

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
  loggedOut = false;
  constructor(private user: User | null) {}
  async login(): Promise<AuthUser | null> {
    return null;
  }
  async logout() {
    this.loggedOut = true;
    this.user = null;
  }
  async getCurrentUser() {
    return this.user;
  }
  async isAuthenticated() {
    return this.user !== null;
  }
  async listOperators() {
    return [];
  }
  async createOperator() {
    return null;
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

const operator: User = {
  id: '1',
  email: 'ops@empresa.com',
  name: 'Ops',
  role: 'admin',
  createdAt: now,
};

const agent: Agent = {
  id: '1',
  name: 'Ops',
  email: 'ops@empresa.com',
  status: 'online',
  conversationsCount: 0,
  responseTime: '—',
  createdAt: now,
};

describe('GetCurrentUserUseCase', () => {
  it('devolve o usuário online', async () => {
    const agents = new MemoryAgents([agent]);
    const user = await new GetCurrentUserUseCase(
      new FakeAuth(operator),
      new EnsureOperatorAgentUseCase(agents),
      agents
    ).execute();
    expect(user?.email).toBe('ops@empresa.com');
  });

  it('agente offline faz logout', async () => {
    const agents = new MemoryAgents([{ ...agent, status: 'offline' }]);
    const auth = new FakeAuth(operator);
    await expect(
      new GetCurrentUserUseCase(auth, new EnsureOperatorAgentUseCase(agents), agents).execute()
    ).rejects.toBeInstanceOf(LoginDeniedError);
    expect(auth.loggedOut).toBe(true);
  });
});
