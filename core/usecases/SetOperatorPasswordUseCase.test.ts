import { IAuthRepository, CreateOperatorInput } from '../repositories/IAuthRepository';
import { AuthUser, User } from '../entities/User';
import { SetOperatorPasswordUseCase } from './SetOperatorPasswordUseCase';

const admin: User = {
  id: 'a1',
  email: 'admin@x.com',
  name: 'Admin',
  role: 'admin',
  createdAt: new Date('2026-08-19'),
};

class FakeAuth implements IAuthRepository {
  users: User[] = [admin];
  passwords = new Map<string, string>([[admin.id, 'oldpass']]);
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
  async setOperatorRole() {
    return false;
  }
  async setOperatorPassword(id: string, password: string) {
    if (!this.users.some((item) => item.id === id)) {
      return false;
    }
    this.passwords.set(id, password);
    return true;
  }
  async deleteOperator() {
    return false;
  }
}

describe('SetOperatorPasswordUseCase', () => {
  it('admin redefine senha', async () => {
    const auth = new FakeAuth();
    auth.users.push({
      id: 'u2',
      email: 'b@x.com',
      name: 'B',
      role: 'user',
      createdAt: admin.createdAt,
    });
    await new SetOperatorPasswordUseCase(auth).execute(admin, 'u2', 'nova12');
    expect(auth.passwords.get('u2')).toBe('nova12');
  });

  it('recusa senha curta, não-admin e id inexistente', async () => {
    const auth = new FakeAuth();
    const useCase = new SetOperatorPasswordUseCase(auth);
    await expect(useCase.execute(admin, 'a1', '123')).rejects.toMatchObject({ status: 400 });
    await expect(
      useCase.execute({ ...admin, role: 'user' }, 'a1', 'secret1')
    ).rejects.toMatchObject({ status: 403 });
    await expect(useCase.execute(admin, 'missing', 'secret1')).rejects.toMatchObject({ status: 404 });
  });
});
