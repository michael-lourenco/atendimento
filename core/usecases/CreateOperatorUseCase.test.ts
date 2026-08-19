import { CreateOperatorError, CreateOperatorUseCase } from './CreateOperatorUseCase';
import { IAuthRepository, CreateOperatorInput } from '../repositories/IAuthRepository';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { Agent } from '../entities/Agent';
import { AuthUser, User } from '../entities/User';
import { EnsureOperatorAgentUseCase } from './EnsureOperatorAgentUseCase';

const admin: User = {
  id: 'a1',
  email: 'admin@x.com',
  name: 'Admin',
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
  users: User[] = [admin];
  async login(): Promise<AuthUser | null> {
    return null;
  }
  async logout() {}
  async getCurrentUser() {
    return admin;
  }
  async isAuthenticated() {
    return true;
  }
  async listOperators() {
    return [...this.users];
  }
  async createOperator(input: CreateOperatorInput) {
    if (this.users.some((item) => item.email.trim().toLowerCase() === input.email.trim().toLowerCase())) {
      return null;
    }
    const user: User = {
      id: `u-${input.email}`,
      email: input.email,
      name: input.name,
      role: input.role,
      createdAt: new Date('2026-08-19'),
    };
    this.users.push(user);
    return user;
  }
  async setOperatorRole(id: string, role: 'admin' | 'user') {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      return false;
    }
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

describe('CreateOperatorUseCase', () => {
  it('só admin cria e grava agente', async () => {
    const auth = new FakeAuth();
    const agents = new MemoryAgents();
    const created = await new CreateOperatorUseCase(
      auth,
      agents,
      new EnsureOperatorAgentUseCase(agents)
    ).execute(admin, {
      email: 'ana@x.com',
      password: 'secret1',
      name: 'Ana',
      role: 'user',
      departmentId: '1',
    });
    expect(created.email).toBe('ana@x.com');
    expect(agents.items[0].id).toBe(created.id);
    expect(agents.items[0].departmentId).toBe('1');
  });

  it('recusa senha curta e não-admin', async () => {
    const auth = new FakeAuth();
    const agents = new MemoryAgents();
    const useCase = new CreateOperatorUseCase(auth, agents, new EnsureOperatorAgentUseCase(agents));
    await expect(
      useCase.execute(admin, {
        email: 'ana@x.com',
        password: '123',
        name: 'Ana',
        role: 'user',
      })
    ).rejects.toBeInstanceOf(CreateOperatorError);
    await expect(
      useCase.execute(
        { ...admin, role: 'user' },
        { email: 'ana@x.com', password: 'secret1', name: 'Ana', role: 'user' }
      )
    ).rejects.toMatchObject({ status: 403 });
  });

  it('recusa e-mail já usado por outro agente', async () => {
    const auth = new FakeAuth();
    const agents = new MemoryAgents([
      {
        id: 'old',
        name: 'Michael',
        email: 'DevMichaelLourenco@gmail.com',
        status: 'online',
        conversationsCount: 0,
        responseTime: '—',
        createdAt: new Date('2026-08-19'),
      },
    ]);
    await expect(
      new CreateOperatorUseCase(auth, agents, new EnsureOperatorAgentUseCase(agents)).execute(admin, {
        email: 'devmichaellourenco@gmail.com',
        password: 'secret1',
        name: 'Michael',
        role: 'user',
      })
    ).rejects.toMatchObject({ status: 409, message: 'Este e-mail já está cadastrado' });
    expect(auth.users).toHaveLength(1);
    expect(agents.items).toHaveLength(1);
  });
});
