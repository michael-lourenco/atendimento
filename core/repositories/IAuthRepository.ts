import { AuthUser, User } from '../entities/User';

export type CreateOperatorInput = {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  departmentId?: string;
};

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthUser | null>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
  listOperators(): Promise<User[]>;
  createOperator(input: CreateOperatorInput): Promise<User | null>;
  setOperatorRole(id: string, role: 'admin' | 'user'): Promise<boolean>;
  setOperatorPassword(id: string, password: string): Promise<boolean>;
  deleteOperator(id: string): Promise<boolean>;
}
