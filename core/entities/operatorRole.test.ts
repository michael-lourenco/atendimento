import { canChangeOperatorRole, canDeleteOperator, isAdmin } from './operatorRole';
import { User } from './User';

const admin: User = {
  id: 'a',
  email: 'a@x.com',
  name: 'A',
  role: 'admin',
  createdAt: new Date('2026-08-19'),
};

describe('operatorRole', () => {
  it('reconhece admin', () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin({ role: 'user' })).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it('não rebaixa o último admin', () => {
    expect(canChangeOperatorRole(admin, [admin], 'a', 'user')).toBe(false);
    expect(
      canChangeOperatorRole(admin, [admin, { ...admin, id: 'b', role: 'user' }], 'a', 'user')
    ).toBe(true);
    expect(canChangeOperatorRole({ ...admin, role: 'user' }, [admin], 'a', 'admin')).toBe(false);
  });

  it('não exclui o último admin', () => {
    expect(canDeleteOperator(admin, [admin], 'a')).toBe(false);
    expect(
      canDeleteOperator(admin, [admin, { ...admin, id: 'b', role: 'admin', email: 'b@x.com' }], 'a')
    ).toBe(true);
    expect(
      canDeleteOperator(admin, [admin, { ...admin, id: 'b', role: 'user', email: 'b@x.com' }], 'b')
    ).toBe(true);
    expect(canDeleteOperator({ ...admin, role: 'user' }, [admin], 'a')).toBe(false);
  });
});
