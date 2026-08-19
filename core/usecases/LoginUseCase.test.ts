import { LoginDeniedError, LoginUseCase } from './LoginUseCase';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { Agent } from '../entities/Agent';
import { AuthUser, User } from '../entities/User';

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
  constructor(private user: AuthUser | null) {}
  async login(email: string, password: string) {
    if (!this.user || password.length === 0 || email !== this.user.email) {
      return null;
    }
    return this.user;
  }
  async logout() {
    this.loggedOut = true;
    this.user = null;
  }
  async getCurrentUser(): Promise<User | null> {
    return this.user ? { ...this.user, createdAt: new Date() } : null;
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

const admin: AuthUser = {
  id: '1',
  email: 'ops@empresa.com',
  name: 'Ops',
  role: 'admin',
};

const onlineAgent: Agent = {
  id: '1',
  name: 'Ops',
  email: 'ops@empresa.com',
  status: 'online',
  conversationsCount: 0,
  responseTime: '—',
  createdAt: new Date('2026-08-19'),
};

describe('LoginUseCase', () => {
  it('autentica com senha válida via porta', async () => {
    const user = await new LoginUseCase(new FakeAuth(admin), new MemoryAgents([onlineAgent])).execute(
      'ops@empresa.com',
      'secret'
    );
    expect(user?.email).toBe('ops@empresa.com');
  });

  it('rejeita senha vazia', async () => {
    const user = await new LoginUseCase(new FakeAuth(admin), new MemoryAgents([onlineAgent])).execute(
      'ops@empresa.com',
      ''
    );
    expect(user).toBeNull();
  });

  it('recusa agente offline e encerra a sessão', async () => {
    const auth = new FakeAuth(admin);
    await expect(
      new LoginUseCase(auth, new MemoryAgents([{ ...onlineAgent, status: 'offline' }])).execute(
        'ops@empresa.com',
        'secret'
      )
    ).rejects.toBeInstanceOf(LoginDeniedError);
    expect(auth.loggedOut).toBe(true);
  });
});
