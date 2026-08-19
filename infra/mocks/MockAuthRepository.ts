import { CreateOperatorInput, IAuthRepository } from '../../core/repositories/IAuthRepository';
import { AuthUser, User } from '../../core/entities/User';

const STORAGE_KEY = 'mock_auth_user';

export class MockAuthRepository implements IAuthRepository {
  private users: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Administrador',
      role: 'admin',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      email: 'user@example.com',
      name: 'Usuário',
      role: 'user',
      createdAt: new Date('2024-01-01'),
    },
  ];

  private getCurrentUserFromStorage(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  private setCurrentUserToStorage(user: AuthUser | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async login(email: string, password: string): Promise<AuthUser | null> {
    // Mock: qualquer senha funciona
    const user = this.users.find(u => u.email === email);
    if (user) {
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token: 'mock-token-' + Date.now(),
      };
      this.setCurrentUserToStorage(authUser);
      return Promise.resolve(authUser);
    }
    return Promise.resolve(null);
  }

  async logout(): Promise<void> {
    this.setCurrentUserToStorage(null);
    return Promise.resolve();
  }

  async getCurrentUser(): Promise<User | null> {
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      return Promise.resolve({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        createdAt: new Date(),
      });
    }
    return Promise.resolve(null);
  }

  async isAuthenticated(): Promise<boolean> {
    const currentUser = this.getCurrentUserFromStorage();
    return Promise.resolve(currentUser !== null);
  }

  async listOperators(): Promise<User[]> {
    return [...this.users];
  }

  async createOperator(input: CreateOperatorInput): Promise<User | null> {
    const email = input.email.trim().toLowerCase();
    if (this.users.some((item) => item.email.toLowerCase() === email)) {
      return null;
    }
    const user: User = {
      id: `user-${Date.now()}`,
      email,
      name: input.name.trim(),
      role: input.role,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async setOperatorRole(id: string, role: 'admin' | 'user'): Promise<boolean> {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      return false;
    }
    user.role = role;
    const stored = this.getCurrentUserFromStorage();
    if (stored?.id === id) {
      this.setCurrentUserToStorage({ ...stored, role });
    }
    return true;
  }
}

export const mockAuthRepository = new MockAuthRepository();

