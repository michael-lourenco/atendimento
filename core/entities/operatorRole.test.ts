import { canChangeOperatorRole, isAdmin } from './operatorRole';
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
});
