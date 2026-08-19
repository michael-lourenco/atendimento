import { Agent } from './Agent';
import { User } from './User';
import { canSetAgentOffline } from './agentStatus';

const now = new Date('2026-08-19');

function agent(id: string, status: Agent['status'] = 'online'): Agent {
  return {
    id,
    name: id,
    email: `${id}@x.com`,
    status,
    conversationsCount: 0,
    responseTime: '—',
    createdAt: now,
  };
}

function user(id: string, role: User['role'] = 'admin'): User {
  return {
    id,
    email: `${id}@x.com`,
    name: id,
    role,
    createdAt: now,
  };
}

describe('canSetAgentOffline', () => {
  const adminA = user('a');
  const adminB = user('b');
  const attendant = user('c', 'user');

  it('não desativa a si', () => {
    expect(canSetAgentOffline(adminA, agent('a'), [agent('a'), agent('b')], [adminA, adminB])).toBe(
      false
    );
  });

  it('não desativa o último admin ainda online', () => {
    expect(
      canSetAgentOffline(
        adminA,
        agent('b'),
        [agent('a', 'offline'), agent('b')],
        [adminA, adminB]
      )
    ).toBe(false);
  });

  it('desativa outro admin se ainda houver um online', () => {
    expect(
      canSetAgentOffline(adminA, agent('b'), [agent('a'), agent('b')], [adminA, adminB])
    ).toBe(true);
  });

  it('desativa atendente que não é admin', () => {
    expect(
      canSetAgentOffline(adminA, agent('c'), [agent('a'), agent('c')], [adminA, attendant])
    ).toBe(true);
  });

  it('atendente não desativa ninguém', () => {
    expect(canSetAgentOffline(attendant, agent('a'), [agent('a')], [adminA, attendant])).toBe(false);
  });
});
