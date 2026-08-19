import { User } from './User';

export function isAdmin(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'admin';
}

export function canChangeOperatorRole(
  actor: User,
  operators: User[],
  targetId: string,
  nextRole: 'admin' | 'user'
): boolean {
  if (!isAdmin(actor)) {
    return false;
  }
  if (nextRole === 'admin') {
    return true;
  }
  const admins = operators.filter((item) => item.role === 'admin');
  return !(admins.length === 1 && admins[0].id === targetId);
}
