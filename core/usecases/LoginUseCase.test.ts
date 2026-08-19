import { LoginUseCase } from './LoginUseCase';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { AuthUser, User } from '../entities/User';

class FakeAuth implements IAuthRepository {
  constructor(private user: AuthUser | null) {}
  async login(email: string, password: string) {
    if (!this.user || password.length === 0 || email !== this.user.email) {
      return null;
    }
    return this.user;
  }
  async logout() {}
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

describe('LoginUseCase', () => {
  it('autentica com senha válida via porta', async () => {
    const user = await new LoginUseCase(new FakeAuth(admin)).execute('ops@empresa.com', 'secret');
    expect(user?.email).toBe('ops@empresa.com');
  });

  it('rejeita senha vazia', async () => {
    const user = await new LoginUseCase(new FakeAuth(admin)).execute('ops@empresa.com', '');
    expect(user).toBeNull();
  });
});
