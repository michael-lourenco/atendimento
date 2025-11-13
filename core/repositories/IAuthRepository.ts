import { AuthUser, User } from '../entities/User';

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthUser | null>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
}

