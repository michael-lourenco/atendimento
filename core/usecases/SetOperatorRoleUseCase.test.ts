import { IAuthRepository, CreateOperatorInput } from '../repositories/IAuthRepository';
import { AuthUser, User } from '../entities/User';
import { SetOperatorRoleUseCase } from './SetOperatorRoleUseCase';

const admin: User = {
  id: 'a1',
  email: 'admin@x.com',
  name: 'Admin',
  role: 'admin',
  createdAt: new Date('2026-08-19'),
};

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
    if (!user) {
      return false;
    }
    user.role = role;
    return true;
  }
}

describe('SetOperatorRoleUseCase', () => {
  it('promove atendente', async () => {
    const auth = new FakeAuth();
    auth.users.push({
      id: 'u2',
      email: 'b@x.com',
      name: 'B',
      role: 'user',
      createdAt: admin.createdAt,
    });
    await new SetOperatorRoleUseCase(auth).execute(admin, 'u2', 'admin');
    expect(auth.users.find((item) => item.id === 'u2')?.role).toBe('admin');
  });

  it('bloqueia rebaixar o último admin', async () => {
    const auth = new FakeAuth();
    await expect(new SetOperatorRoleUseCase(auth).execute(admin, 'a1', 'user')).rejects.toMatchObject({
      status: 400,
    });
  });
});
