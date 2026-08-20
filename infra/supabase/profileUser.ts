import { User } from '../../core/entities/User';
import { asDate } from './crud';

export function userFromProfileRow(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    name: String(row.name ?? ''),
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: asDate(row.created_at),
  };
}
