import { AuthUser, User } from '../../core/entities/User';
import { CreateOperatorInput, IAuthRepository } from '../../core/repositories/IAuthRepository';

async function parseUser(response: Response): Promise<AuthUser | User | null> {
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export class SupabaseAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<AuthUser | null> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  }

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  }

  async getCurrentUser(): Promise<User | null> {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    return (await parseUser(response)) as User | null;
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getCurrentUser()) !== null;
  }

  async listOperators(): Promise<User[]> {
    const response = await fetch('/api/operators', { credentials: 'include' });
    if (!response.ok) {
      return [];
    }
    return response.json();
  }

  async createOperator(input: CreateOperatorInput): Promise<User | null> {
    const response = await fetch('/api/operators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  }

  async setOperatorRole(id: string, role: 'admin' | 'user'): Promise<boolean> {
    const response = await fetch(`/api/operators/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    return response.ok;
  }
}
